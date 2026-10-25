import { createHash } from "node:crypto";
import { OPERATIONS } from "../../src/config/operations.ts";
import { OperationError, qualifiedTable } from "./database.mjs";

export async function schemaDescription(client) {
	const parameters = [OPERATIONS.schema];
	const columns = await client.query(
		`SELECT table_name, column_name, ordinal_position, data_type, udt_name, is_nullable, column_default
		FROM information_schema.columns WHERE table_schema=$1 ORDER BY table_name, ordinal_position`,
		parameters,
	);
	const constraints = await client.query(
		`SELECT c.relname AS table_name, p.conname AS name, p.contype AS type, pg_get_constraintdef(p.oid) AS definition
		FROM pg_constraint p JOIN pg_class c ON c.oid=p.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
		WHERE n.nspname=$1 ORDER BY c.relname,p.conname`,
		parameters,
	);
	const indexes = await client.query(
		"SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname=$1 ORDER BY tablename,indexname",
		parameters,
	);
	const enums = await client.query(
		`SELECT t.typname, e.enumlabel, e.enumsortorder FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
		JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=$1 ORDER BY t.typname,e.enumsortorder`,
		parameters,
	);
	return {
		columns: columns.rows,
		constraints: constraints.rows,
		indexes: indexes.rows,
		enums: enums.rows,
	};
}

export function schemaHash(schema) {
	return createHash("sha256").update(JSON.stringify(schema)).digest("hex");
}

export function contentTables(schema) {
	return [...new Set(schema.columns.map((column) => column.table_name))].filter(
		(table) =>
			!OPERATIONS.excludedTables.includes(table) &&
			!OPERATIONS.excludedPrefixes.some((prefix) => table.startsWith(prefix)),
	);
}

export async function assertEmptyTables(client, tables) {
	for (const table of tables) {
		const { rows } = await client.query(
			`SELECT EXISTS(SELECT 1 FROM ${qualifiedTable(table)}) AS occupied`,
		);
		if (rows[0].occupied) {
			throw new OperationError(`Target table is not empty: ${table}`);
		}
	}
}

export async function dependencyOrder(client, tables) {
	const { rows } = await client.query(
		`SELECT c.relname AS child, p.relname AS parent FROM pg_constraint f
		JOIN pg_class c ON c.oid=f.conrelid JOIN pg_class p ON p.oid=f.confrelid
		JOIN pg_namespace n ON n.oid=c.relnamespace WHERE f.contype='f' AND n.nspname=$1`,
		[OPERATIONS.schema],
	);
	const remaining = new Set(tables),
		ordered = [];
	while (remaining.size) {
		const ready = [...remaining].filter(
			(table) =>
				!rows.some(
					(row) =>
						row.child === table &&
						row.parent !== table &&
						remaining.has(row.parent),
				),
		);
		if (!ready.length) {
			throw new OperationError(
				"Cyclic foreign keys require an explicit reviewed data transformation",
			);
		}
		for (const table of ready) {
			ordered.push(table);
			remaining.delete(table);
		}
	}
	return ordered;
}
