import type { PayloadHandler } from "payload";
import { COLLECTIONS } from "@/config/content";
import { NOTIFICATION_STATUS } from "@/config/forms";
import { JOBS } from "@/config/jobs";
import { parsePositiveRouteID, requireStaffRequest } from "./request-guards";

export const retryNotification: PayloadHandler = async (req) => {
	requireStaffRequest(req);
	const id = parsePositiveRouteID(req.routeParams?.id, "Заявка не найдена.");
	const lead = await req.payload.findByID({
		collection: COLLECTIONS.leads,
		id,
		overrideAccess: false,
		req,
	});
	if (lead.notificationStatus === NOTIFICATION_STATUS.sent) {
		return Response.json({ success: true });
	}
	await req.payload.update({
		collection: COLLECTIONS.leads,
		id,
		data: { notificationStatus: NOTIFICATION_STATUS.pending },
		overrideAccess: true,
		req,
	});
	await req.payload.jobs.queue({
		task: JOBS.notifyLead,
		queue: JOBS.emailQueue,
		input: { leadID: id },
		req,
	});
	return Response.json({ success: true });
};
