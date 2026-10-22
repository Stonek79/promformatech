import { APIError, type PayloadHandler } from "payload";
import { COLLECTIONS } from "@/config/content";
import { HTTP, NOTIFICATION_STATUS } from "@/config/forms";
import { JOBS } from "@/config/media";
import { isStaff } from "../access";

export const retryNotification: PayloadHandler = async (req) => {
	if (!isStaff(req.user)) {
		throw new APIError("Требуется вход.", HTTP.unauthorized);
	}
	const id = Number(req.routeParams?.id);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new APIError("Заявка не найдена.", HTTP.notFound);
	}
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
