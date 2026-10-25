import { JOBS } from "../../src/config/jobs.ts";
import { OPERATIONS } from "../../src/config/operations.ts";
import { OperationError, qualifiedTable } from "./database.mjs";

const TASKS = new Map([
	[
		JOBS.processMedia,
		{ queue: JOBS.mediaQueue, input: "mediaID", table: "media" },
	],
	[
		JOBS.notifyLead,
		{ queue: JOBS.emailQueue, input: "leadID", table: "leads" },
	],
]);

async function verifyJob(client, job) {
	const definition = TASKS.get(job.task_slug);
	if (!definition || job.queue !== definition.queue) {
		throw new OperationError("Snapshot contains an unsupported task or queue");
	}
	if (job.processing && (job.completed_at || job.has_error)) {
		throw new OperationError("Snapshot contains an inconsistent job state");
	}
	const attempts = Number(job.total_tried);
	if (!Number.isSafeInteger(attempts) || attempts < 0) {
		throw new OperationError("Snapshot contains an invalid retry counter");
	}
	const input = job.input;
	if (!input || typeof input !== "object") {
		throw new OperationError("Snapshot contains missing task input");
	}
	const id = input[definition.input];
	if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
		throw new OperationError("Snapshot contains an invalid task reference");
	}
	const result = await client.query(
		`SELECT EXISTS(SELECT 1 FROM ${qualifiedTable(definition.table)} WHERE id=$1) AS present`,
		[id],
	);
	if (!result.rows[0].present) {
		throw new OperationError(
			"Snapshot contains a task referencing a missing document",
		);
	}
}

export async function verifyJobState(client) {
	await client.query(
		"DECLARE verification_jobs NO SCROLL CURSOR FOR SELECT task_slug,queue,input,completed_at,processing,has_error,total_tried FROM payload_jobs ORDER BY id",
	);
	try {
		let more = true;
		while (more) {
			const { rows } = await client.query(
				`FETCH ${OPERATIONS.copyBatchRows} FROM verification_jobs`,
			);
			more = rows.length > 0;
			for (const job of rows) {
				await verifyJob(client, job);
			}
		}
	} finally {
		await client.query("CLOSE verification_jobs");
	}
}
