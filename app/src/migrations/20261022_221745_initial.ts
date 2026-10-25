import { readFile } from "node:fs/promises";
import { type MigrateUpArgs, sql } from "@payloadcms/db-postgres";
import { INITIAL_SCHEMA_FILES } from "./initial/files";

export async function up({ db }: MigrateUpArgs): Promise<void> {
	const existing = await db.execute(
		sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
	);
	if (existing.rows.length) {
		throw new Error(
			"Initial migration requires an empty database; import content into a fresh migrated schema instead.",
		);
	}
	const parts = await Promise.all(
		INITIAL_SCHEMA_FILES.map((filename) =>
			readFile(new URL(`./initial/${filename}`, import.meta.url), "utf8"),
		),
	);
	await db.execute(sql.raw(parts.join("")));
}

export async function down(): Promise<void> {
	throw new Error(
		"Initial schema cannot be dropped automatically. Restore a verified snapshot into a separate database.",
	);
}
