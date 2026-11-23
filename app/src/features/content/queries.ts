import { getCMS } from "@/cms/client";
import {
	COLLECTIONS,
	CONTENT_LIMITS,
	CONTEXT,
	GLOBALS,
	type ShowcaseCollection,
} from "@/config/content";
import type { Locale } from "@/i18n/config";
import { cachePublished } from "./cache";
import { readPageLocales } from "./page-locales";
import { readLocalizedSettings } from "./site-settings";

export function publicRead() {
	return {
		draft: false,
		depth: CONTENT_LIMITS.previewDepth,
		overrideAccess: false,
		context: { [CONTEXT.publicContent]: true },
	} as const;
}

export const publishedSettings = cachePublished(
	"publishedSettings",
	async (locale: Locale) => {
		const cms = await getCMS();
		return readLocalizedSettings(locale, (locale) =>
			cms.findGlobal({
				...publicRead(),
				slug: GLOBALS.site,
				locale,
				fallbackLocale: false,
			}),
		);
	},
);

export const publishedPageLocales = cachePublished(
	"publishedPageLocales",
	async (slug: string, locale: Locale) => {
		const cms = await getCMS();
		return readPageLocales(locale, async (contentLocale) => {
			const result = await cms.find({
				...publicRead(),
				collection: COLLECTIONS.pages,
				locale: contentLocale,
				fallbackLocale: false,
				limit: 1,
				where: { slug: { equals: slug } },
			});
			return result.docs[0] || null;
		});
	},
);

export const publishedMaterial = cachePublished(
	"publishedMaterial",
	async (collection: ShowcaseCollection, slug: string, locale: Locale) => {
		const result = await (await getCMS()).find({
			...publicRead(),
			collection,
			locale,
			fallbackLocale: false,
			limit: 1,
			where: { slug: { equals: slug } },
		});
		return result.docs[0] || null;
	},
);

export const publishedMaterials = cachePublished(
	"publishedMaterials",
	async (collection: ShowcaseCollection, locale: Locale) => {
		return (
			await (
				await getCMS()
			).find({
				...publicRead(),
				collection,
				locale,
				fallbackLocale: false,
				...materialListOptions,
				limit: CONTENT_LIMITS.pageSize,
			})
		).docs;
	},
);

export const materialListOptions = {
	sort: ["order", "id"],
	select: {
		title: true,
		summary: true,
		slug: true,
		featuredImage: true,
	} as const,
};
