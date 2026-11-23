import { mkdir } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { getCMS } from "@/cms/client";
import { getRuntimeConfig, PROCESS_ROLE } from "@/config/runtime";
import { migrateDatabase } from "@/features/database/migrate";
import { databasePath } from "@/features/database/path";

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
		await migrateDatabase(cms);
	} finally {
		await cms.destroy();
	}
} finally {
	await release();
}
