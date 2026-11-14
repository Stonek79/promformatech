import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { getCMS } from "@/cms/client";
import { seedSite } from "@/cms/seed/run";
import { getRuntimeConfig } from "@/config/runtime";
import { databasePath } from "@/features/database/path";

const runtime = getRuntimeConfig();
const send = process.send?.bind(process);
if (!runtime.schemaPush || !send) {
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

const cms = await getCMS();
try {
	if (!existingFile || existingFile.size === 0) {
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
