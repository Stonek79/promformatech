import { rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";
import { JOB_POLICY } from "@/config/jobs";
import { MEDIA_STORAGE } from "@/config/media-storage";
import { STORAGE_ROOT } from "@/features/media/storage";

export async function startWorkerHeartbeat(cms: Payload) {
	const file = path.join(STORAGE_ROOT, JOB_POLICY.heartbeatFile);
	const temporary = `${file}.tmp`;
	let stopped = false;
	let current = Promise.resolve();
	const write = async () => {
		await writeFile(
			temporary,
			JSON.stringify({ updatedAt: new Date().toISOString(), pid: process.pid }),
			{ mode: MEDIA_STORAGE.fileMode },
		);
		await rename(temporary, file);
	};
	await write();
	const timer = setInterval(() => {
		if (stopped) {
			return;
		}
		current = current.then(write).catch(() => {
			cms.logger.warn("Worker heartbeat write failed");
		});
	}, JOB_POLICY.heartbeatMilliseconds);
	timer.unref();
	return async () => {
		stopped = true;
		clearInterval(timer);
		await current;
		await rm(file, { force: true });
	};
}
