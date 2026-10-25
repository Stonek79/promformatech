import {
	APIError,
	type CollectionAfterChangeHook,
	type CollectionBeforeChangeHook,
	type CollectionBeforeOperationHook,
} from "payload";
import { COLLECTIONS, CONTEXT, PUBLICATION } from "@/config/content";
import { HTTP } from "@/config/forms";
import { JOBS } from "@/config/jobs";
import { MEDIA_MIME_TYPES, MEDIA_STATUS, mediaURL } from "@/config/media";
import { MEDIA_DELIVERY, MEDIA_KIND } from "@/config/media-assets";
import {
	mediaPublicationSnapshot,
	processingSnapshot,
} from "@/features/media/publication";
import { isMediaPublished } from "@/features/media/reference-access";
import { saveOriginal } from "@/features/media/storage";
import { uploadSource } from "@/features/media/upload-source";
import { invalidatePublishedContent } from "./content";

export const protectUsedMedia: CollectionBeforeOperationHook = async ({
	args,
	operation,
	req,
}) => {
	const data = args && "data" in args ? args.data : undefined;
	const id = args && "id" in args ? Number(args.id) : undefined;
	if (
		operation === "update" &&
		data &&
		typeof data === "object" &&
		"_status" in data &&
		data._status === PUBLICATION.draft &&
		!args.draft &&
		id &&
		Number.isSafeInteger(id) &&
		(await isMediaPublished(req.payload, id, req))
	) {
		throw new APIError(
			"Сначала уберите файл из опубликованных материалов. Изменение описания можно сохранить черновиком.",
			HTTP.badRequest,
		);
	}
	return args;
};

export const publishReadyMedia: CollectionBeforeChangeHook = async ({
	data,
	operation,
	originalDoc,
	req,
}) => {
	if (operation !== "update" || data._status !== PUBLICATION.published) {
		return data;
	}
	const latest = await req.payload.findByID({
		collection: COLLECTIONS.media,
		id: originalDoc.id,
		draft: true,
		depth: 0,
		overrideAccess: true,
		req,
	});
	if (latest.processingStatus !== MEDIA_STATUS.ready) {
		throw new APIError(
			"Файл ещё не готов. Дождитесь завершения обработки.",
			HTTP.badRequest,
		);
	}
	return {
		...mediaPublicationSnapshot(latest),
		...data,
		...processingSnapshot(latest),
	};
};

export const preserveOriginal: CollectionBeforeChangeHook = async ({
	data,
	operation,
	originalDoc,
	req,
}) => {
	if (operation === "update" && req.file) {
		throw new APIError(
			"Для замены загрузите новый файл и выберите его в материале. Исходник опубликованной версии сохранится.",
			HTTP.badRequest,
		);
	}
	if (
		data.archived &&
		!originalDoc?.archived &&
		originalDoc?.id &&
		(await isMediaPublished(req.payload, originalDoc.id, req))
	) {
		throw new APIError(
			"Этот файл используется на опубликованном сайте. Сначала замените его в материалах и опубликуйте изменения.",
			HTTP.badRequest,
		);
	}
	if (operation !== "create" || !req.file) {
		return data;
	}
	if (!MEDIA_MIME_TYPES.some((mime) => mime === req.file?.mimetype)) {
		throw new APIError(
			"Поддерживаются JPEG, PNG, WebP, AVIF, MP4, MOV и WebM.",
			HTTP.badRequest,
		);
	}
	const storageKey = await saveOriginal(uploadSource(req.file));
	req.context[CONTEXT.pendingOriginal] = storageKey;
	return {
		...data,
		storageKey,
		processingStatus: MEDIA_STATUS.queued,
		kind: req.file.mimetype.startsWith("image/")
			? MEDIA_KIND.image
			: MEDIA_KIND.video,
	};
};

export const queueMedia: CollectionAfterChangeHook = async ({
	doc,
	operation,
	req,
}) => {
	if (operation === "create") {
		await req.payload.jobs.queue({
			task: JOBS.processMedia,
			queue: JOBS.mediaQueue,
			input: { mediaID: doc.id },
			req,
		});
	}
	if (doc._status === PUBLICATION.published) {
		invalidatePublishedContent();
	}
	return doc;
};

export function mediaDocumentURL(doc: {
	id: number;
	kind?: string;
	processingStatus?: string;
	_status?: string;
}) {
	if (doc.processingStatus !== MEDIA_STATUS.ready) {
		return undefined;
	}
	return mediaURL(
		doc.id,
		doc.kind === MEDIA_KIND.video ? MEDIA_DELIVERY.video : MEDIA_DELIVERY.image,
		{
			draft: doc._status === PUBLICATION.draft,
		},
	);
}
