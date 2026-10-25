import type { Payload } from "payload";
import { JOB_POLICY } from "@/config/jobs";
import { recoverInterruptedJobs } from "./recover-jobs";

export async function acquireWorker(cms: Payload, onLost?: () => void) {
	const connection = await cms.db.pool.connect();
	let locked = false,
		released = false;
	if (onLost) {
		connection.on("error", onLost);
	}
	function releaseConnection(error?: Error) {
		if (released) {
			return;
		}
		released = true;
		if (onLost) {
			connection.removeListener("error", onLost);
		}
		connection.release(error);
	}
	async function unlock() {
		if (released) {
			return;
		}
		try {
			if (locked) {
				await connection.query("SELECT pg_advisory_unlock($1)", [
					JOB_POLICY.workerLockKey,
				]);
			}
			releaseConnection();
		} catch (error) {
			releaseConnection(
				error instanceof Error
					? error
					: new Error("Worker lock release failed"),
			);
			throw error;
		}
	}
	try {
		const { rows } = await connection.query<{ locked: boolean }>(
			"SELECT pg_try_advisory_lock($1) AS locked",
			[JOB_POLICY.workerLockKey],
		);
		locked = Boolean(rows[0]?.locked);
		if (!locked) {
			throw new Error("Для этой базы worker уже запущен.");
		}
		await recoverInterruptedJobs(cms);
		return unlock;
	} catch (error) {
		try {
			await unlock();
		} catch {
			/* The unusable connection was already destroyed. */
		}
		throw error;
	}
}
