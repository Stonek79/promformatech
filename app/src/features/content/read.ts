import { cache } from "react";
import { getCMS } from "@/cms/client";
import {
	COLLECTIONS,
	CONTENT_LIMITS,
	CONTEXT,
	GLOBALS,
	type ShowcaseCollection,
} from "@/config/content";
import { readMaterialCards, readMaterialLocales } from "./material-locales";
import { readPageLocales } from "./page-locales";
import {
	materialListOptions,
	publishedMaterial,
	publishedMaterials,
	publishedPageLocales,
	publishedSettings,
} from "./queries";
import { readLocalizedSettings } from "./site-settings";
import type { Viewer } from "./viewer";

const previewOptions = (viewer: Viewer) => ({
	draft: true,
	user: viewer.user,
	depth: CONTENT_LIMITS.previewDepth,
	overrideAccess: false,
	context: { [CONTEXT.publicContent]: true },
});

export async function readSettings(viewer: Viewer) {
	if (!viewer.preview) {
		return publishedSettings(viewer.locale);
	}
	const cms = await getCMS();
	return readLocalizedSettings(viewer.locale, (locale) =>
		cms.findGlobal({
			...previewOptions(viewer),
			slug: GLOBALS.site,
			locale,
			fallbackLocale: false,
		}),
	);
}

export const readPage = cache(async (slug: string, viewer: Viewer) => {
	if (!viewer.preview) {
		return publishedPageLocales(slug, viewer.locale);
	}
	const cms = await getCMS();
	return readPageLocales(viewer.locale, async (locale) => {
		const { docs } = await cms.find({
			...previewOptions(viewer),
			collection: COLLECTIONS.pages,
			locale,
			fallbackLocale: false,
			where: { slug: { equals: slug } },
			limit: 1,
		});
		return docs[0] || null;
	});
});

export const readMaterial = cache(
	async (collection: ShowcaseCollection, slug: string, viewer: Viewer) => {
		if (!viewer.preview) {
			return readMaterialLocales(viewer.locale, (locale) =>
				publishedMaterial(collection, slug, locale),
			);
		}
		const cms = await getCMS();
		return readMaterialLocales(viewer.locale, async (locale) => {
			const { docs } = await cms.find({
				...previewOptions(viewer),
				collection,
				locale,
				fallbackLocale: false,
				where: { slug: { equals: slug } },
				limit: 1,
			});
			return docs[0] || null;
		});
	},
);

export async function readMaterials(
	collection: ShowcaseCollection,
	viewer: Viewer,
) {
	if (!viewer.preview) {
		return readMaterialCards(collection, viewer.locale, (locale) =>
			publishedMaterials(collection, locale),
		);
	}
	const cms = await getCMS();
	return readMaterialCards(
		collection,
		viewer.locale,
		async (locale) =>
			(
				await cms.find({
					...previewOptions(viewer),
					collection,
					locale,
					fallbackLocale: false,
					...materialListOptions,
					limit: CONTENT_LIMITS.pageSize,
				})
			).docs,
	);
}
