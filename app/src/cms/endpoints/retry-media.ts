import { APIError, type PayloadHandler } from "payload";
import { COLLECTIONS } from "@/config/content";
import { HTTP } from "@/config/forms";
import { JOBS } from "@/config/jobs";
import { MEDIA_STATUS } from "@/config/media";
import { parsePositiveRouteID, requireStaffRequest } from "./request-guards";

export const retryMedia: PayloadHandler = async (req) => {
	requireStaffRequest(req);
	const id = parsePositiveRouteID(req.routeParams?.id, "Файл не найден.");
	const media = await req.payload.findByID({
		collection: COLLECTIONS.media,
		id,
		draft: true,
		overrideAccess: false,
		req,
	});
	if (media.processingStatus !== MEDIA_STATUS.error) {
		throw new APIError(
			"Повтор доступен для файлов с ошибкой обработки.",
			HTTP.conflict,
		);
	}
	await req.payload.update({
		collection: COLLECTIONS.media,
		id,
		draft: true,
		data: { processingStatus: MEDIA_STATUS.queued, error: null },
		overrideAccess: true,
		req,
	});
	await req.payload.jobs.queue({
		task: JOBS.processMedia,
		queue: JOBS.mediaQueue,
		input: { mediaID: id },
		req,
	});
	return Response.json({ success: true });
};
