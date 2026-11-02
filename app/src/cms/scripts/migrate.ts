import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { MigrateUpArgs } from "@payloadcms/db-sqlite";
import lockfile from "proper-lockfile";
import { getCMS } from "@/cms/client";
import { getRuntimeConfig, PROCESS_ROLE } from "@/config/runtime";
import { verifyLedger } from "@/features/database/ledger";
import { databasePath } from "@/features/database/path";
import { migrations } from "@/migrations";

const runtime = getRuntimeConfig();
if (runtime.build || runtime.role !== PROCESS_ROLE.migrator) {
	throw new Error(
		"Migrations require APP_PROCESS_ROLE=migrator outside the build.",
	);
}
const file = databasePath();
await mkdir(path.dirname(file), { recursive: true });
const release = await lockfile.lock(file, { realpath: false, retries: 0 });
try {
	const cms = await getCMS();
	try {
		await verifyLedger(cms, false);
		await cms.db.migrate({
			migrations: migrations.map((migration) => ({
				...migration,
				// Payload's base adapter erases the provider-specific migration arguments.
				up: (args: unknown) => migration.up(args as MigrateUpArgs),
			})),
		});
		await verifyLedger(cms);
	} finally {
		await cms.destroy();
	}
} finally {
	await release();
}
