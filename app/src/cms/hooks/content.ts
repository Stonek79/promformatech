import { randomUUID } from "node:crypto";
import { revalidateTag } from "next/cache.js";
import {
	APIError,
	type CollectionAfterChangeHook,
	type CollectionAfterDeleteHook,
	type CollectionBeforeChangeHook,
	type CollectionBeforeOperationHook,
	type CollectionBeforeValidateHook,
	Forbidden,
	type GlobalBeforeChangeHook,
	type GlobalBeforeOperationHook,
} from "payload";
import { COLLECTIONS, CONTENT_CACHE, PUBLICATION } from "@/config/content";
import { HTTP } from "@/config/http";
import { collectMediaReferences } from "@/features/media/references";
import { slugify } from "@/lib/slug";
import { isStaff } from "../access";
import { publishReferencedMedia } from "./publication-media";

const assignSlug: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
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
	if (isDraftReadDenied(operation, args, req.user)) {
		throw new Forbidden();
	}
	return args;
};

export const protectGlobalDrafts: GlobalBeforeOperationHook = ({
	args,
	operation,
	req,
}) => {
	if (isDraftReadDenied(operation, args, req.user)) {
		throw new Forbidden();
	}
	return args;
};

function isDraftReadDenied(
	operation: string,
	args: unknown,
	user: Parameters<typeof isStaff>[0],
): boolean {
	if (operation !== "read" || typeof args !== "object" || args === null) {
		return false;
	}
	const isDraft = "draft" in args && args.draft === true;
	const overrideAccess =
		"overrideAccess" in args && args.overrideAccess === true;
	return isDraft && !overrideAccess && !isStaff(user);
}

async function validatePublication(
	data: Record<string, unknown>,
	req: Parameters<CollectionBeforeChangeHook>[0]["req"],
) {
	const { ids, expectedKinds } = collectMediaReferences(data);
	if (data._status === PUBLICATION.published) {
		for (const id of ids) {
			await publishReferencedMedia(id, expectedKinds.get(id) || new Set(), req);
		}
	}
	return ids;
}

const validateCollectionPublication: CollectionBeforeChangeHook = async ({
	data,
	originalDoc,
	req,
	collection,
}) => {
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

const invalidateAfterChange: CollectionAfterChangeHook = ({ doc }) => {
	invalidatePublishedContent();
	return doc;
};

const invalidateAfterDelete: CollectionAfterDeleteHook = () => {
	invalidatePublishedContent();
};

export function contentCollectionHooks() {
	return {
		beforeOperation: [protectCollectionDrafts],
		beforeValidate: [assignSlug],
		beforeChange: [validateCollectionPublication],
		afterChange: [invalidateAfterChange],
		afterDelete: [invalidateAfterDelete],
	};
}
