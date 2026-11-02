import { MIGRATION_POLICY } from "@/config/migrations";

type MigrationRow = {
	readonly name: string | null;
	readonly batch: string | number | null;
};

function validMigration(row: MigrationRow) {
	const batch = Number(row.batch);
	return Number.isSafeInteger(batch) && batch >= MIGRATION_POLICY.minimumBatch;
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
