import { APIError, type CollectionBeforeChangeHook, NotFound } from "payload";
import { COLLECTIONS, PUBLICATION } from "@/config/content";
import { HTTP } from "@/config/http";
import { MEDIA_STATUS } from "@/config/media";
import type { MediaKind } from "@/config/media-assets";
import { mediaPublicationSnapshot } from "@/features/media/publication";
import { mediaTitleFromFilename } from "@/features/media/title";
import { getMessages } from "@/i18n/messages";
import type { Media } from "@/payload-types";

type Request = Parameters<CollectionBeforeChangeHook>[0]["req"];

function fileName(media: Media) {
	return (
		media.title?.trim() ||
		media.filename ||
		getMessages().cms.mediaNaming.fileNumber(media.id)
	);
}

async function getMedia(id: number, req: Request) {
	try {
		return await req.payload.findByID({
			collection: COLLECTIONS.media,
			id,
			depth: 0,
			draft: true,
			overrideAccess: true,
			req,
		});
	} catch (error) {
		if (!(error instanceof NotFound)) {
			throw error;
		}
		const name = getMessages().cms.mediaNaming.fileNumber(id);
		throw new APIError(
			getMessages().cms.mediaPublication.missing(name),
			HTTP.badRequest,
		);
	}
}

function assertMediaReady(media: Media, expected: ReadonlySet<MediaKind>) {
	const messages = getMessages().cms.mediaPublication;
	const name = fileName(media);
	if (media.archived) {
		throw new APIError(messages.archived(name), HTTP.badRequest);
	}
	if (media.processingStatus === MEDIA_STATUS.error) {
		throw new APIError(messages.processingFailed(name), HTTP.badRequest);
	}
	if (media.processingStatus !== MEDIA_STATUS.ready) {
		throw new APIError(messages.notReady(name), HTTP.badRequest);
	}
	if ([...expected].some((kind) => kind !== media.kind)) {
		throw new APIError(messages.wrongKind(name), HTTP.badRequest);
	}
}

export async function publishReferencedMedia(
	id: number,
	expected: ReadonlySet<MediaKind>,
	req: Request,
) {
	const media = await getMedia(id, req);
	assertMediaReady(media, expected);
	if (media._status === PUBLICATION.published) {
		return;
	}
	const title =
		media.title?.trim() ||
		mediaTitleFromFilename(media.filename, new Date(media.createdAt));
	try {
		await req.payload.update({
			collection: COLLECTIONS.media,
			id,
			data: {
				...mediaPublicationSnapshot(media),
				title,
				_status: PUBLICATION.published,
			},
			overrideAccess: true,
			req,
		});
	} catch (error) {
		if (!(error instanceof APIError) || error.status !== HTTP.badRequest) {
			throw error;
		}
		throw new APIError(
			getMessages().cms.mediaPublication.invalid(
				fileName(media),
				error.message,
			),
			HTTP.badRequest,
		);
	}
}
