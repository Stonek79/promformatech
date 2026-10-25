import { Pool } from "pg";
import { HEALTH } from "@/config/health";
import { MIGRATION_POLICY } from "@/config/migrations";
import { getRuntimeConfig } from "@/config/runtime";

let pool: Pool | undefined;
type MigrationRow = {
	readonly name: string | null;
	readonly batch: string | number | null;
};

function validMigration(row: MigrationRow) {
	const batch = Number(row.batch);
	return Number.isSafeInteger(batch) && batch >= MIGRATION_POLICY.minimumBatch;
}

function databasePool() {
	if (!pool) {
		const runtime = getRuntimeConfig();
		pool = new Pool({
			...runtime.pool,
			connectionString: runtime.databaseURL,
			max: HEALTH.poolConnections,
			query_timeout: HEALTH.queryTimeoutMilliseconds,
			statement_timeout: HEALTH.queryTimeoutMilliseconds,
			allowExitOnIdle: true,
		});
		pool.on("error", () => {
			// A lost idle connection is replaced on the next readiness attempt.
		});
	}
	return pool;
}

export function migrationsMatch(rows: readonly MigrationRow[]) {
	if (!rows.every(validMigration)) {
		return false;
	}
	if (rows.length !== MIGRATION_POLICY.required.length) {
		return false;
	}
	return MIGRATION_POLICY.required.every((name) =>
		rows.some((row) => row.name === name),
	);
}

async function checkDatabase() {
	const connection = databasePool();
	await connection.query(HEALTH.select);
	if (!getRuntimeConfig().production) {
		return true;
	}
	const result = await connection.query<MigrationRow>(HEALTH.migrations);
	return migrationsMatch(result.rows);
}

export async function isReady() {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		const deadline = new Promise<false>((resolve) => {
			timer = setTimeout(() => resolve(false), HEALTH.deadlineMilliseconds);
		});
		return await Promise.race([checkDatabase(), deadline]);
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}
