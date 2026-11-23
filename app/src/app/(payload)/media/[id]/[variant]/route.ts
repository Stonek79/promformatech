import { draftMode } from "next/headers";
import { isStaff } from "@/cms/access";
import { getCMS } from "@/cms/client";
import { COLLECTIONS, CONTEXT, PUBLICATION } from "@/config/content";
import { HTTP } from "@/config/http";
import { MEDIA_STATUS } from "@/config/media";
import {
	MEDIA_DELIVERY,
	MEDIA_VARIANTS,
	type MediaVariant,
} from "@/config/media-assets";
import { publishedMediaIDs } from "@/features/media/published";
import { serveFile } from "@/features/media/serve-file";
import { storagePaths, variantPath } from "@/features/media/storage";

type Args = { readonly params: Promise<{ id: string; variant: string }> };

function notFound() {
	return new Response(null, {
		status: HTTP.notFound,
		headers: { "Cache-Control": "private, no-store" },
	});
}

export async function GET(request: Request, { params }: Args) {
	const { id: rawID, variant } = await params;
	const id = Number(rawID);
	if (
		!/^\d+$/.test(rawID) ||
		!Number.isSafeInteger(id) ||
		id <= 0 ||
		(variant !== MEDIA_DELIVERY.original &&
			variant !== MEDIA_DELIVERY.captions &&
			!Object.hasOwn(MEDIA_VARIANTS, variant))
	) {
		return notFound();
	}
	const cms = await getCMS();
	const { user } = await cms.auth({ headers: request.headers });
	const staff = isStaff(user);
	if (
		!staff &&
		(variant === MEDIA_DELIVERY.original ||
			!(await publishedMediaIDs()).includes(id))
	) {
		return notFound();
	}
	const draftRequested =
		new URL(request.url).searchParams.get("draft") === "true";
	const draft =
		staff &&
		(draftRequested ||
			variant === MEDIA_DELIVERY.original ||
			(await draftMode()).isEnabled);
	try {
		const media = await cms.findByID({
			collection: COLLECTIONS.media,
			id,
			draft,
			depth: 0,
			overrideAccess: false,
			user,
			context: { [CONTEXT.publicContent]: true, [CONTEXT.mediaFile]: true },
		});
		if (!media.storageKey) {
			return notFound();
		}
		if (variant === MEDIA_DELIVERY.original) {
			return await serveFile(
				request,
				storagePaths(media.storageKey).original,
				media.mimeType || "application/octet-stream",
				{ filename: media.filename || "original" },
			);
		}
		if (media.processingStatus !== MEDIA_STATUS.ready || !media.derivativeKey) {
			return notFound();
		}
		if (variant === MEDIA_DELIVERY.captions) {
			if (!media.captionTrack) {
				return notFound();
			}
			return new Response(
				request.method === "HEAD" ? null : media.captionTrack,
				{
					headers: {
						"Content-Type": "text/vtt; charset=utf-8",
						"Cache-Control": "private, no-store",
						"X-Content-Type-Options": "nosniff",
					},
				},
			);
		}
		const selected = variant as MediaVariant;
		const mime = MEDIA_VARIANTS[selected].mime;
		const cacheable =
			!draft &&
			!draftRequested &&
			mime.startsWith("image/") &&
			media._status === PUBLICATION.published &&
			(!staff || (await publishedMediaIDs()).includes(id));
		return await serveFile(
			request,
			variantPath(media.storageKey, media.derivativeKey, selected),
			mime,
			{ etag: cacheable ? `"${media.derivativeKey}-${selected}"` : undefined },
		);
	} catch {
		return notFound();
	}
}

export const HEAD = GET;
