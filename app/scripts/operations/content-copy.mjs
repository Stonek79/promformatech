import { createHash } from "node:crypto";
import { OPERATIONS } from "../../src/config/operations.ts";
import {
	OperationError,
	qualifiedTable,
	quoteIdentifier,
} from "./database.mjs";

async function primaryKeys(client, table) {
	const { rows } = await client.query(
		`SELECT a.attname FROM pg_index i
		JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
		JOIN pg_attribute a ON a.attrelid=c.oid AND a.attnum=ANY(i.indkey)
		WHERE i.indisprimary AND n.nspname=$1 AND c.relname=$2 ORDER BY a.attnum`,
		[OPERATIONS.schema, table],
	);
	if (!rows.length) {
		throw new OperationError(`No stable primary key for table: ${table}`);
	}
	return rows.map((row) => quoteIdentifier(row.attname)).join(",");
}

function valuesFor(row, columns) {
	return columns.map((column) => {
		const value = row[column.column_name];
		if (
			value !== null &&
			(column.data_type === "jsonb" || column.data_type === "json")
		) {
			return JSON.stringify(value);
		}
		return value;
	});
}

async function readRows(client, table, keys, consume) {
	const cursor = "content_transfer_cursor";
	await client.query(
		`DECLARE ${cursor} NO SCROLL CURSOR FOR SELECT * FROM ${qualifiedTable(table)} ORDER BY ${keys}`,
	);
	try {
		let more = true;
		while (more) {
			const { rows } = await client.query(
				`FETCH ${OPERATIONS.copyBatchRows} FROM ${cursor}`,
			);
			more = rows.length > 0;
			for (const row of rows) {
				await consume(row);
			}
		}
	} finally {
		await client.query(`CLOSE ${cursor}`);
	}
}

export async function tableDigest(client, table) {
	const hash = createHash("sha256"),
		keys = await primaryKeys(client, table);
	let count = 0;
	await readRows(client, table, keys, async (row) => {
		hash.update(JSON.stringify(row));
		hash.update("\n");
		count++;
	});
	return { count, sha256: hash.digest("hex") };
}

export async function copyTable(source, target, table, schema) {
	const columns = schema.columns.filter(
		(column) => column.table_name === table,
	);
	const fields = columns
		.map((column) => quoteIdentifier(column.column_name))
		.join(",");
	const parameters = columns.map((_, index) => `$${index + 1}`).join(",");
	const statement = `INSERT INTO ${qualifiedTable(table)} (${fields}) VALUES (${parameters})`;
	const keys = await primaryKeys(source, table),
		hash = createHash("sha256");
	let count = 0;
	await readRows(source, table, keys, async (row) => {
		await target.query(statement, valuesFor(row, columns));
		hash.update(JSON.stringify(row));
		hash.update("\n");
		count++;
	});
	return { count, sha256: hash.digest("hex") };
}

export async function restoreSequences(source, target, tables, schema) {
	for (const column of schema.columns.filter((item) =>
		tables.includes(item.table_name),
	)) {
		if (!column.column_default?.startsWith("nextval(")) {
			continue;
		}
		const { rows } = await source.query(
			"SELECT pg_get_serial_sequence($1,$2) AS name",
			[`${OPERATIONS.schema}.${column.table_name}`, column.column_name],
		);
		const sequence = rows[0]?.name;
		if (!sequence) {
			continue;
		}
		const sequenceName = sequence
			.split(".")
			.map((part) => quoteIdentifier(part.replaceAll('"', "")))
			.join(".");
		const state = await source.query(
			`SELECT last_value, is_called FROM ${sequenceName}`,
		);
		await target.query("SELECT setval($1::regclass,$2,$3)", [
			sequence,
			state.rows[0].last_value,
			state.rows[0].is_called,
		]);
	}
}
