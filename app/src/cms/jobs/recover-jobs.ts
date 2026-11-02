import {
	commitTransaction,
	createLocalReq,
	initTransaction,
	killTransaction,
	type Payload,
} from "payload";
import { COLLECTIONS, SYSTEM_COLLECTIONS } from "@/config/content";
import { JOB_POLICY, JOBS } from "@/config/jobs";
import { MEDIA_STATUS } from "@/config/media";
import { getMessages } from "@/i18n/messages";
import type { PayloadJob } from "@/payload-types";

const RECOVERY_PAGE_SIZE = 100;
const FIRST_RECOVERY_ATTEMPT = 1;
type RecoveryJob = Pick<PayloadJob, "id" | "queue" | "input" | "totalTried">;

function numericInput(input: unknown, key: string) {
	if (typeof input !== "object" || input === null || !(key in input)) {
		return;
	}
	const value = Reflect.get(input, key);
	return typeof value === "number" && Number.isSafeInteger(value) && value > 0
		? value
		: undefined;
}

async function recoverJob(cms: Payload, job: RecoveryJob) {
	const req = await createLocalReq({}, cms);
	await initTransaction(req);
	try {
		const messages = getMessages().cms.mediaProcessing;
		const mediaID = numericInput(job.input, "mediaID");
		const media =
			job.queue === JOBS.mediaQueue && mediaID
				? (
						await cms.find({
							collection: COLLECTIONS.media,
							where: { id: { equals: mediaID } },
							limit: 1,
							draft: true,
							overrideAccess: true,
							req,
						})
					).docs[0]
				: undefined;
		const completed = media?.processingStatus === MEDIA_STATUS.ready;
		const attempts =
			(job.totalTried || 0) + (completed ? 0 : FIRST_RECOVERY_ATTEMPT);
		const missing = !media;
		const exhausted =
			missing || (!completed && attempts > JOB_POLICY.retryAttempts);
		await cms.update({
			collection: SYSTEM_COLLECTIONS.jobs,
			id: job.id,
			overrideAccess: true,
			req,
			data: {
				processing: false,
				totalTried: attempts,
				hasError: exhausted,
				waitUntil: new Date(
					Date.now() + JOB_POLICY.retryDelayMilliseconds,
				).toISOString(),
			},
		});
		if (media && !completed) {
			await cms.update({
				collection: COLLECTIONS.media,
				id: media.id,
				draft: true,
				overrideAccess: true,
				req,
				data: {
					processingStatus: exhausted
						? MEDIA_STATUS.error
						: MEDIA_STATUS.queued,
					error: exhausted ? messages.exhausted : messages.interrupted,
				},
			});
		}
		await commitTransaction(req);
	} catch (error) {
		await killTransaction(req);
		throw error;
	}
}

export async function recoverInterruptedJobs(cms: Payload) {
	let remaining = true;
	while (remaining) {
		const jobs = await cms.find({
			collection: SYSTEM_COLLECTIONS.jobs,
			where: {
				and: [
					{ processing: { equals: true } },
					{ queue: { equals: JOBS.mediaQueue } },
				],
			},
			limit: RECOVERY_PAGE_SIZE,
			depth: 0,
			overrideAccess: true,
		});
		remaining = jobs.docs.length > 0;
		for (const job of jobs.docs) {
			await recoverJob(cms, job);
		}
	}
}
