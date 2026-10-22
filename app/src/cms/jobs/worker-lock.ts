import type { Payload } from "payload";
import { SYSTEM_COLLECTIONS } from "@/config/content";
import { JOBS } from "@/config/media";

const WORKER_LOCK_KEY = 0x504654;

export async function acquireWorker(cms: Payload) {
	const connection = await cms.db.pool.connect();
	const { rows } = await connection.query<{ locked: boolean }>(
		"SELECT pg_try_advisory_lock($1) AS locked",
		[WORKER_LOCK_KEY],
	);
	if (!rows[0]?.locked) {
		connection.release();
		throw new Error("Для этой базы worker уже запущен.");
	}
	try {
		// The lock proves there is no other live worker before interrupted jobs are resumed.
		await cms.update({
			collection: SYSTEM_COLLECTIONS.jobs,
			where: {
				and: [
					{ processing: { equals: true } },
					{ queue: { in: [JOBS.mediaQueue, JOBS.emailQueue] } },
				],
			},
			data: { processing: false },
			overrideAccess: true,
		});
	} catch (error) {
		await connection.query("SELECT pg_advisory_unlock($1)", [WORKER_LOCK_KEY]);
		connection.release();
		throw error;
	}
	return async () => {
		await connection.query("SELECT pg_advisory_unlock($1)", [WORKER_LOCK_KEY]);
		connection.release();
	};
}
