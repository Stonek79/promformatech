import { setTimeout as delay } from "node:timers/promises";
import type { Payload } from "payload";
import { getCMS } from "@/cms/client";
import { JOB_POLICY, JOBS } from "@/config/jobs";
import { MEDIA_POLICY, MEDIA_UPLOAD } from "@/config/media";
import { getRuntimeConfig } from "@/config/runtime";
import { reconcilePendingOriginals } from "@/features/media/orphan-originals";
import { stopMediaProcesses } from "@/features/media/process-command";
import { startWorkerHeartbeat } from "../jobs/worker-heartbeat";
import { acquireWorker } from "../jobs/worker-lock";

const FORCE_EXIT_DELAY_MILLISECONDS = 5000;
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
function lostLock(cms: Payload) {
	// No further database writes are safe after ownership is lost.
	stopMediaProcesses();
	cms.logger.error("Worker database lock lost; stopping immediately");
	process.exit(1);
}
async function runJobs(cms: Payload) {
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
}

async function run() {
	const cms = await getCMS();
	let release: (() => Promise<void>) | undefined;
	let heartbeat: (() => Promise<void>) | undefined;
	try {
		if (stopping) {
			return;
		}
		release = await acquireWorker(cms, () => lostLock(cms));
		if (stopping) {
			return;
		}
		heartbeat = await startWorkerHeartbeat(cms);
		await runJobs(cms);
	} finally {
		try {
			await heartbeat?.();
		} finally {
			await cms.destroy().finally(() => release?.());
		}
	}
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
	await run();
} catch (error) {
	if (
		error instanceof Error &&
		"code" in error &&
		error.code === "ELOCKED" &&
		!getRuntimeConfig().production
	) {
		throw new Error(
			"SQLite уже используется другим воркером. Остановите прежний pnpm dev или pnpm worker и дождитесь его завершения.",
			{ cause: error },
		);
	}
	throw error;
} finally {
	clearTimeout(shutdownTimer);
	clearTimeout(exitTimer);
	process.removeListener("SIGINT", stop);
	process.removeListener("SIGTERM", stop);
}
