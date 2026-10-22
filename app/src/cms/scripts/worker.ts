import { setTimeout as delay } from "node:timers/promises";
import { getCMS } from "@/cms/client";
import { JOBS, MEDIA_POLICY } from "@/config/media";
import { stopMediaProcesses } from "@/features/media/process-command";
import { acquireWorker } from "../jobs/worker-lock";

const cms = await getCMS();
const release = await acquireWorker(cms);
const abort = new AbortController();
let stopping = false;
function stop() {
	stopping = true;
	abort.abort();
	stopMediaProcesses();
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
	do {
		await cms.jobs.run({
			queue: JOBS.emailQueue,
			limit: MEDIA_POLICY.workerConcurrency,
			sequential: true,
		});
		if (!stopping) {
			await cms.jobs.run({
				queue: JOBS.mediaQueue,
				limit: MEDIA_POLICY.workerConcurrency,
				sequential: true,
			});
		}
		if (process.argv.includes("once")) {
			break;
		}
		try {
			await delay(MEDIA_POLICY.workerPollMilliseconds, undefined, {
				signal: abort.signal,
			});
		} catch {
			/* Shutdown interrupts only the wait. */
		}
	} while (!stopping);
} finally {
	process.removeListener("SIGINT", stop);
	process.removeListener("SIGTERM", stop);
	await release();
	await cms.destroy();
}
