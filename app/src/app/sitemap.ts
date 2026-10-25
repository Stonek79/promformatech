import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getCMS } from "@/cms/client";
import { COLLECTIONS, SHOWCASE_COLLECTIONS } from "@/config/content";
import { cachePublished } from "@/features/content/cache";
import { materialPath, pagePath, serverURL } from "@/lib/urls";

export const dynamic = "force-dynamic";

const publishedSitemap = cachePublished(
	"sitemap",
	async (): Promise<MetadataRoute.Sitemap> => {
		const cms = await getCMS();
		const entries: MetadataRoute.Sitemap = [];
		for (const collection of [COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS]) {
			const result = await cms.find({
				collection,
				draft: false,
				overrideAccess: false,
				depth: 0,
				limit: 0,
			});
			for (const doc of result.docs) {
				if (doc.seo?.noIndex) {
					continue;
				}
				const pathname =
					collection === COLLECTIONS.pages
						? pagePath(doc.slug)
						: materialPath(collection, doc.slug);
				entries.push({
					url: pathname,
					lastModified: doc.updatedAt,
				});
			}
		}
		return entries;
	},
);

export default async function sitemap() {
	await connection();
	const entries = await publishedSitemap();
	return entries.map((entry) => ({
		...entry,
		url: new URL(entry.url, serverURL()).toString(),
	}));
}
