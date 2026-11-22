import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { getCMS } from "@/cms/client";
import { seedSite } from "@/cms/seed/run";
import { getRuntimeConfig, PROCESS_ROLE } from "@/config/runtime";
import { databasePath } from "@/features/database/path";

const runtime = getRuntimeConfig();
const send = process.send?.bind(process);
if (runtime.role !== PROCESS_ROLE.web || !send) {
	throw new Error("Запускайте подготовку базы через pnpm dev.");
}

const file = databasePath();
await mkdir(path.dirname(file), { recursive: true });
const existingFile = await stat(file).catch((error: unknown) => {
	if (error instanceof Error && "code" in error && error.code === "ENOENT") {
		return undefined;
	}
	throw error;
});

const emptyDatabase = !existingFile || existingFile.size === 0;
if (emptyDatabase && !runtime.schemaPush) {
	throw new Error(
		"SQLite-база пуста. Примените миграции или включите синхронизацию схемы.",
	);
}

const cms = await getCMS();
try {
	if (emptyDatabase) {
		await seedSite(cms);
	}
} finally {
	await cms.destroy();
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
