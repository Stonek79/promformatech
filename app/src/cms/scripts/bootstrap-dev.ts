import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import lockfile from "proper-lockfile";
import { getCMS } from "@/cms/client";
import { seedSite } from "@/cms/seed/run";
import { getRuntimeConfig, PROCESS_ROLE } from "@/config/runtime";
import { adoptLegacyDevDatabase } from "@/features/database/legacy-dev";
import { migrateDatabase } from "@/features/database/migrate";
import { databasePath } from "@/features/database/path";

const runtime = getRuntimeConfig();
const send = process.send?.bind(process);
if (
	runtime.production ||
	runtime.schemaPush ||
	runtime.role !== PROCESS_ROLE.web ||
	!send
) {
	throw new Error("Запускайте подготовку базы через pnpm dev.");
}

const file = databasePath();
await mkdir(path.dirname(file), { recursive: true });
const release = await lockfile.lock(file, { realpath: false, retries: 0 });
try {
	const existingFile = await stat(file).catch((error: unknown) => {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return undefined;
		}
		throw error;
	});
	const emptyDatabase = !existingFile || existingFile.size === 0;
	if (!emptyDatabase) {
		await adoptLegacyDevDatabase(file);
	}
	const cms = await getCMS();
	try {
		await migrateDatabase(cms);
		if (emptyDatabase) {
			await seedSite(cms);
		}
	} finally {
		await cms.destroy();
	}
} finally {
	await release();
}

await new Promise<void>((resolve, reject) => {
	send(true, (error) => {
		if (error) {
			reject(error);
			return;
		}
		resolve();
	});
});
