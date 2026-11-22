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
import {
	CONTENT_CACHE,
	PUBLICATION,
	SHOWCASE_COLLECTIONS,
	type ShowcaseCollection,
} from "@/config/content";
import { HTTP } from "@/config/http";
import { collectMediaReferences } from "@/features/media/references";
import { DEFAULT_LOCALE } from "@/i18n/config";
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

type PublicationContext = Parameters<CollectionBeforeChangeHook>[0];

const hasText = (value: unknown) =>
	typeof value === "string" && value.trim().length > 0;

async function validateMaterialPublication(
	values: Record<string, unknown>,
	collection: ShowcaseCollection,
	req: PublicationContext["req"],
) {
	if (req.locale === DEFAULT_LOCALE) {
		if (!hasText(values.summary) || !values.featuredImage) {
			throw new APIError(
				"Для публикации добавьте краткое описание и главное изображение. Незавершённый материал можно сохранить черновиком.",
				HTTP.badRequest,
			);
		}
		return;
	}
	const id = values.id;
	const source =
		typeof id === "number" || typeof id === "string"
			? await req.payload.findByID({
					collection,
					id,
					locale: DEFAULT_LOCALE,
					fallbackLocale: false,
					draft: true,
					depth: 0,
					select: { title: true, summary: true },
					disableErrors: true,
					overrideAccess: false,
					req: {
						user: req.user,
						transactionID: req.transactionID,
						context: req.context,
					},
				})
			: null;
	if (
		!hasText(source?.title) ||
		!hasText(source?.summary) ||
		!values.featuredImage
	) {
		throw new APIError(
			"Для публикации заполните название и краткое описание на русском и добавьте главное изображение.",
			HTTP.badRequest,
		);
	}
}

const validateCollectionPublication: CollectionBeforeChangeHook = async ({
	data,
	originalDoc,
	req,
	collection,
}) => {
	const merged = { ...originalDoc, ...data };
	const showcase = SHOWCASE_COLLECTIONS.find(
		(slug) => slug === collection.slug,
	);
	if (merged._status === PUBLICATION.published && showcase) {
		await validateMaterialPublication(merged, showcase, req);
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
		beforeOperation: [defaultContentLocale, protectCollectionDrafts],
		beforeValidate: [assignSlug],
		beforeChange: [validateCollectionPublication],
		afterChange: [invalidateAfterChange],
		afterDelete: [invalidateAfterDelete],
	};
}

const defaultContentLocale: CollectionBeforeOperationHook = ({ args, req }) => {
	req.locale ??= DEFAULT_LOCALE;
	return args;
};
