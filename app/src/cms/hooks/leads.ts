import type { CollectionAfterChangeHook } from "payload";
import { JOBS } from "@/config/jobs";

export const queueLeadNotification: CollectionAfterChangeHook = async ({
	doc,
	operation,
	req,
}) => {
	if (operation === "create") {
		await req.payload.jobs.queue({
			task: JOBS.notifyLead,
			queue: JOBS.emailQueue,
			input: { leadID: doc.id },
			req,
		});
	}
	return doc;
};
