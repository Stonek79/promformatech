import { existsSync } from "node:fs";
import { Client } from "pg";
import { MIGRATION_POLICY } from "../../src/config/migrations.ts";
import { OPERATIONS } from "../../src/config/operations.ts";
import { RUNTIME } from "../../src/config/runtime.ts";

export class OperationError extends Error {}

export function loadEnvironment() {
	const filename = process.env.OPERATIONS_ENV_FILE || ".env";
	if (existsSync(filename)) {
		process.loadEnvFile(filename);
	}
}

export function quoteIdentifier(value) {
	return `"${value.replaceAll('"', '""')}"`;
}

export function qualifiedTable(table) {
	return `${quoteIdentifier(OPERATIONS.schema)}.${quoteIdentifier(table)}`;
}

export async function connectDatabase(connectionString) {
	if (!connectionString) {
		throw new OperationError("Database URL is required");
	}
	const client = new Client({
		connectionString,
		connectionTimeoutMillis: RUNTIME.connectionTimeoutMilliseconds,
		statement_timeout: RUNTIME.migrationTimeoutMilliseconds,
	});
	await client.connect();
	return client;
}

async function tableNames(client) {
	const { rows } = await client.query(
		"SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_type='BASE TABLE' ORDER BY table_name",
		[OPERATIONS.schema],
	);
	return rows.map((row) => row.table_name);
}

export async function verifyMigrationLedger(client, { exact = true } = {}) {
	const tables = await tableNames(client);
	if (!tables.includes(OPERATIONS.ledger)) {
		if (tables.length || exact) {
			throw new OperationError(
				"A fresh database with a verified migration ledger is required",
			);
		}
		return;
	}
	const { rows } = await client.query(
		`SELECT name, batch FROM ${qualifiedTable(OPERATIONS.ledger)} ORDER BY name`,
	);
	if (rows.some((row) => !Number.isSafeInteger(Number(row.batch)))) {
		throw new OperationError("Migration batches must be integers");
	}
	if (rows.some((row) => row.batch < MIGRATION_POLICY.minimumBatch)) {
		throw new OperationError(
			"Dev migration markers are forbidden; import data into a new database",
		);
	}
	if (rows.some((row) => !MIGRATION_POLICY.required.includes(row.name))) {
		throw new OperationError(
			"Unknown migration ledger entries; release/schema mismatch",
		);
	}
	if (exact && rows.length !== MIGRATION_POLICY.required.length) {
		throw new OperationError("Not all release migrations have been applied");
	}
}

export async function operationLock(client) {
	const { rows } = await client.query(
		"SELECT pg_try_advisory_lock($1) AS locked",
		[OPERATIONS.lockKey],
	);
	if (!rows[0]?.locked) {
		throw new OperationError("Another database operation is running");
	}
	return () =>
		client.query("SELECT pg_advisory_unlock($1)", [OPERATIONS.lockKey]);
}

export function reportError(error) {
	console.error(
		error instanceof OperationError
			? error.message
			: "Operation failed; no credentials are printed. Inspect the isolated environment and database state before retrying.",
	);
	process.exitCode = 1;
}
