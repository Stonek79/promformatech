import { setTimeout as delay } from "node:timers/promises";
import { getCMS } from "@/cms/client";
import { JOB_POLICY, JOBS } from "@/config/jobs";
import { MEDIA_POLICY, MEDIA_UPLOAD } from "@/config/media";
import { reconcilePendingOriginals } from "@/features/media/orphan-originals";
import { stopMediaProcesses } from "@/features/media/process-command";
import { startWorkerHeartbeat } from "../jobs/worker-heartbeat";
import { acquireWorker } from "../jobs/worker-lock";

const FORCE_EXIT_DELAY_MILLISECONDS = 5000;
const cms = await getCMS();
const abort = new AbortController();
let stopping = false;
let shutdownTimer: ReturnType<typeof setTimeout> | undefined;
let exitTimer: ReturnType<typeof setTimeout> | undefined;
function stop() {
	if (stopping) {
		return;
	}
	stopping = true;
	abort.abort();
	shutdownTimer = setTimeout(
		stopMediaProcesses,
		JOB_POLICY.shutdownGraceMilliseconds,
	);
	exitTimer = setTimeout(
		() => process.exit(1),
		JOB_POLICY.shutdownGraceMilliseconds + FORCE_EXIT_DELAY_MILLISECONDS,
	);
	exitTimer.unref();
}
function lostLock() {
	// No further database writes are safe after ownership is lost.
	stopMediaProcesses();
	cms.logger.error("Worker database lock lost; stopping immediately");
	process.exit(1);
}
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
let release: (() => Promise<void>) | undefined;
let heartbeat: (() => Promise<void>) | undefined;
try {
	release = await acquireWorker(cms, lostLock);
	heartbeat = await startWorkerHeartbeat(cms);
	let lastReconciliation = 0;
	do {
		if (stopping) {
			break;
		}
		if (
			Date.now() - lastReconciliation >=
			MEDIA_UPLOAD.reconcileIntervalMilliseconds
		) {
			try {
				await reconcilePendingOriginals(cms);
			} catch {
				cms.logger.warn("Pending original reconciliation deferred");
			}
			lastReconciliation = Date.now();
		}
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
		if (process.argv.includes(JOB_POLICY.onceArgument)) {
			break;
		}
		try {
			await delay(MEDIA_POLICY.workerPollMilliseconds, undefined, {
				signal: abort.signal,
			});
		} catch {
			/* Shutdown interrupts the idle wait. */
		}
	} while (!stopping);
} finally {
	clearTimeout(shutdownTimer);
	clearTimeout(exitTimer);
	process.removeListener("SIGINT", stop);
	process.removeListener("SIGTERM", stop);
	try {
		await heartbeat?.();
	} finally {
		try {
			await release?.();
		} finally {
			await cms.destroy();
		}
	}
}
