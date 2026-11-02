import type { Payload } from "payload";
import lockfile from "proper-lockfile";
import { DATABASE } from "@/config/database";
import { JOB_POLICY } from "@/config/jobs";
import { databasePath } from "@/features/database/path";
import { recoverInterruptedJobs } from "./recover-jobs";

export async function acquireWorker(cms: Payload, onLost?: () => void) {
	const file = databasePath();
	const release = await lockfile.lock(file, {
		lockfilePath: `${file}${DATABASE.lockSuffix}`,
		stale: JOB_POLICY.lockStaleMilliseconds,
		update: JOB_POLICY.lockUpdateMilliseconds,
		retries: 0,
		onCompromised: (error) => {
			if (onLost) {
				onLost();
				return;
			}
			throw error;
		},
	});
	try {
		await recoverInterruptedJobs(cms);
		return release;
	} catch (error) {
		await release();
		throw error;
	}
}
