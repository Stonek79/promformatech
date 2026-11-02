import type { Payload } from "payload";
import { MIGRATION_POLICY } from "@/config/migrations";

export async function verifyLedger(cms: Payload, exact = true) {
	const client = cms.db.drizzle.$client;
	const tables = await client.execute(
		"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
	);
	if (!tables.rows.length && !exact) {
		return;
	}
	const result = await client.execute(
		"SELECT name, batch FROM payload_migrations ORDER BY id",
	);
	const names = result.rows.map((row) => String(row.name));
	const valid = result.rows.every(
		(row) =>
			Number.isSafeInteger(Number(row.batch)) &&
			Number(row.batch) >= MIGRATION_POLICY.minimumBatch,
	);
	if (
		!valid ||
		names.some((name, index) => name !== MIGRATION_POLICY.required[index])
	) {
		throw new Error(
			"Migration ledger mismatch: use a fresh database, not a development schema.",
		);
	}
	if (exact && names.length !== MIGRATION_POLICY.required.length) {
		throw new Error("Not all release migrations have been applied.");
	}
}
