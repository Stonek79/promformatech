import type { TaskConfig } from "payload";
import { JOB_POLICY, JOBS } from "@/config/jobs";
import { runMediaJob } from "../jobs/process-media";

export const processMediaTask: TaskConfig<{
	input: { mediaID: number };
	output: { success: boolean };
}> = {
	slug: JOBS.processMedia,
	label: "Подготовка фото и видео",
	retries: {
		attempts: JOB_POLICY.retryAttempts,
		backoff: { type: "fixed", delay: JOB_POLICY.retryDelayMilliseconds },
	},
	concurrency: () => JOBS.mediaQueue,
	inputSchema: [{ name: "mediaID", type: "number", required: true }],
	outputSchema: [{ name: "success", type: "checkbox" }],
	handler: runMediaJob,
};
