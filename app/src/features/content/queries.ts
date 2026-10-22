import { getCMS } from "@/cms/client";
import {
	COLLECTIONS,
	CONTENT_LIMITS,
	CONTEXT,
	GLOBALS,
	type ShowcaseCollection,
} from "@/config/content";
import { cachePublished } from "./cache";

function publicRead() {
	return {
		draft: false,
		depth: CONTENT_LIMITS.previewDepth,
		overrideAccess: false,
		context: { [CONTEXT.publicContent]: true },
	} as const;
}

export const publishedSettings = cachePublished(
	"publishedSettings",
	async () => {
		return (await getCMS()).findGlobal({ ...publicRead(), slug: GLOBALS.site });
	},
);

export const publishedPage = cachePublished(
	"publishedPage",
	async (slug: string) => {
		const result = await (await getCMS()).find({
			...publicRead(),
			collection: COLLECTIONS.pages,
			limit: 1,
			where: { slug: { equals: slug } },
		});
		return result.docs[0] || null;
	},
);

export const publishedMaterial = cachePublished(
	"publishedMaterial",
	async (collection: ShowcaseCollection, slug: string) => {
		const result = await (await getCMS()).find({
			...publicRead(),
			collection,
			limit: 1,
			where: { slug: { equals: slug } },
		});
		return result.docs[0] || null;
	},
);

export const publishedMaterials = cachePublished(
	"publishedMaterials",
	async (collection: ShowcaseCollection) => {
		return (
			await (
				await getCMS()
			).find({
				...publicRead(),
				collection,
				sort: "order",
				limit: CONTENT_LIMITS.pageSize,
			})
		).docs;
	},
);

export const publishedSearch = cachePublished(
	"publishedSearch",
	async (query: string) => {
		if (query.length < CONTENT_LIMITS.minimumSearchQuery) {
			return [];
		}
		const cms = await getCMS();
		const matches = [];
		for (const collection of [
			COLLECTIONS.pages,
			COLLECTIONS.products,
			COLLECTIONS.services,
			COLLECTIONS.projects,
		]) {
			const { docs } = await cms.find({
				...publicRead(),
				collection,
				limit: CONTENT_LIMITS.pageSize,
				where: {
					or: [
						{ title: { contains: query } },
						...(collection === COLLECTIONS.pages
							? []
							: [{ summary: { contains: query } }]),
					],
				},
			});
			for (const doc of docs) {
				matches.push({ collection, doc });
			}
		}
		return matches;
	},
);
