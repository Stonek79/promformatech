import { draftMode } from "next/headers";
import { isStaff } from "@/cms/access";
import { getCMS } from "@/cms/client";
import { COLLECTIONS, CONTEXT } from "@/config/content";
import { HTTP } from "@/config/forms";
import {
	MEDIA_DELIVERY,
	MEDIA_STATUS,
	MEDIA_VARIANTS,
	type MediaVariant,
} from "@/config/media";
import { publishedMediaIDs } from "@/features/media/published";
import { serveFile } from "@/features/media/serve-file";
import { storagePaths, variantPath } from "@/features/media/storage";

type Args = { readonly params: Promise<{ id: string; variant: string }> };

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
		return new Response(null, { status: HTTP.notFound });
	}
	const cms = await getCMS();
	const { user } = await cms.auth({ headers: request.headers });
	const staff = isStaff(user);
	if (
		!staff &&
		(variant === MEDIA_DELIVERY.original ||
			!(await publishedMediaIDs()).includes(id))
	) {
		return new Response(null, { status: HTTP.notFound });
	}
	try {
		const media = await cms.findByID({
			collection: COLLECTIONS.media,
			id,
			draft:
				staff &&
				((await draftMode()).isEnabled ||
					new URL(request.url).searchParams.get("draft") === "true" ||
					variant === MEDIA_DELIVERY.original),
			depth: 0,
			overrideAccess: false,
			user,
			context: { [CONTEXT.publicContent]: true, [CONTEXT.mediaFile]: true },
		});
		if (!media.storageKey) {
			return new Response(null, { status: HTTP.notFound });
		}
		if (variant === MEDIA_DELIVERY.original) {
			return await serveFile(
				request,
				storagePaths(media.storageKey).original,
				media.mimeType || "application/octet-stream",
				media.filename || "original",
			);
		}
		if (media.processingStatus !== MEDIA_STATUS.ready || !media.derivativeKey) {
			return new Response(null, { status: HTTP.notFound });
		}
		if (variant === MEDIA_DELIVERY.captions) {
			if (!media.captionTrack) {
				return new Response(null, { status: HTTP.notFound });
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
		return await serveFile(
			request,
			variantPath(media.storageKey, media.derivativeKey, selected),
			MEDIA_VARIANTS[selected].mime,
		);
	} catch {
		return new Response(null, { status: HTTP.notFound });
	}
}

export const HEAD = GET;
