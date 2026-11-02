import { access } from "node:fs/promises";
import { getCMS } from "@/cms/client";
import { HEALTH } from "@/config/health";
import { getRuntimeConfig } from "@/config/runtime";
import { migrationsMatch } from "@/features/database/migration-state";
import { databasePath } from "@/features/database/path";

async function checkDatabase() {
	await access(databasePath());
	const cms = await getCMS();
	const connection = cms.db.drizzle.$client;
	await connection.execute(HEALTH.select);
	if (!getRuntimeConfig().production) {
		return true;
	}
	const result = await connection.execute(HEALTH.migrations);
	return migrationsMatch(
		result.rows.map((row) => ({
			name: String(row.name),
			batch: Number(row.batch),
		})),
	);
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
