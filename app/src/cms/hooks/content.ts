import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache";
import {
	APIError,
	type CollectionBeforeChangeHook,
	type CollectionBeforeOperationHook,
	type CollectionBeforeValidateHook,
	Forbidden,
	type GlobalBeforeChangeHook,
	type GlobalBeforeOperationHook,
} from "payload";
import { COLLECTIONS, CONTENT_CACHE, PUBLICATION } from "@/config/content";
import { HTTP } from "@/config/forms";
import { MEDIA_STATUS } from "@/config/media";
import { mediaPublicationSnapshot } from "@/features/media/publication";
import {
	collectMediaIDs,
	collectTypedMedia,
} from "@/features/media/references";
import { slugify } from "@/lib/slug";
import { isStaff } from "../access";

export const assignSlug: CollectionBeforeValidateHook = ({
	data,
	originalDoc,
}) => {
	if (data && !data.slug) {
		data.slug =
			originalDoc?.slug || slugify(data.title || "") || `item-${randomUUID()}`;
	}
	return data;
};

export const protectCollectionDrafts: CollectionBeforeOperationHook = ({
	args,
	operation,
	req,
}) => {
	if (
		operation === "read" &&
		args?.draft &&
		!args.overrideAccess &&
		!isStaff(req.user)
	) {
		throw new Forbidden();
	}
	return args;
};

export const protectGlobalDrafts: GlobalBeforeOperationHook = ({
	args,
	operation,
	req,
}) => {
	if (
		operation === "read" &&
		args?.draft &&
		!args.overrideAccess &&
		!isStaff(req.user)
	) {
		throw new Forbidden();
	}
	return args;
};

async function validatePublication(
	data: Record<string, unknown>,
	req: Parameters<CollectionBeforeChangeHook>[0]["req"],
) {
	const ids = collectMediaIDs(data);
	const expectedKinds = collectTypedMedia(data);
	if (data._status === PUBLICATION.published) {
		for (const id of ids) {
			const media = await req.payload.findByID({
				collection: COLLECTIONS.media,
				id,
				depth: 0,
				draft: true,
				overrideAccess: true,
				req,
			});
			if (media.processingStatus !== MEDIA_STATUS.ready || media.archived) {
				throw new APIError(
					`Файл «${media.title || media.filename}» ещё не готов или архивирован. Дождитесь обработки и повторите публикацию.`,
					HTTP.badRequest,
				);
			}
			if (
				[...(expectedKinds.get(id) || [])].some((kind) => kind !== media.kind)
			) {
				throw new APIError(
					`Файл «${media.title}» выбран не в том поле. Используйте фотографию для изображения и видеозапись для видео.`,
					HTTP.badRequest,
				);
			}
			if (media._status !== PUBLICATION.published) {
				await req.payload.update({
					collection: COLLECTIONS.media,
					id,
					data: {
						...mediaPublicationSnapshot(media),
						_status: PUBLICATION.published,
					},
					overrideAccess: true,
					req,
				});
			}
		}
	}
	return ids;
}

export const validateCollectionPublication: CollectionBeforeChangeHook =
	async ({ data, originalDoc, req, collection }) => {
		const merged = { ...originalDoc, ...data };
		if (
			merged._status === PUBLICATION.published &&
			collection.slug !== COLLECTIONS.pages
		) {
			if (!merged.summary?.trim() || !merged.featuredImage) {
				throw new APIError(
					"Для публикации добавьте краткое описание и главное изображение. Незавершённый материал можно сохранить черновиком.",
					HTTP.badRequest,
				);
			}
		}
		return { ...data, referencedMedia: await validatePublication(merged, req) };
	};

export const validateGlobalPublication: GlobalBeforeChangeHook = async ({
	data,
	originalDoc,
	req,
}) => ({
	...data,
	referencedMedia: await validatePublication({ ...originalDoc, ...data }, req),
});

export function invalidatePublishedContent() {
	// CLI seed and the worker have no Next.js cache context; HTTP edits invalidate the shared cache.
	if (process.env.NEXT_RUNTIME === "nodejs") {
		revalidateTag(CONTENT_CACHE.tag, { expire: 0 });
	}
}
