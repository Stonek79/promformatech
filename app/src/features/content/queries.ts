import { getCMS } from "@/cms/client";
import {
	COLLECTIONS,
	CONTENT_LIMITS,
	CONTEXT,
	GLOBALS,
	SHOWCASE_COLLECTIONS,
	type ShowcaseCollection,
} from "@/config/content";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { Page } from "@/payload-types";
import { cachePublished } from "./cache";
import { localizedText, readSourceLocales } from "./localized-fields";
import { readLocalizedSettings } from "./site-settings";

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

export const publishedPage = cachePublished(
	"publishedPage",
	async (slug: string, locale: Locale) => {
		const result = await (await getCMS()).find({
			...publicRead(),
			collection: COLLECTIONS.pages,
			locale,
			fallbackLocale: false,
			limit: 1,
			where: { slug: { equals: slug } },
		});
		return result.docs[0] || null;
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

type SearchCollection = typeof COLLECTIONS.pages | ShowcaseCollection;
type SearchHit = Pick<Page, "id" | "slug" | "title">;
type CMS = Awaited<ReturnType<typeof getCMS>>;

async function readSearchTitles(
	cms: CMS,
	collection: SearchCollection,
	locale: Locale,
	ids: readonly number[],
) {
	if (!ids.length) {
		return new Map<number, string | null | undefined>();
	}
	const { docs } = await cms.find({
		...publicRead(),
		collection,
		locale,
		fallbackLocale: false,
		limit: ids.length,
		select: { title: true },
		where: { id: { in: [...ids] } },
	});
	return new Map(docs.map(({ id, title }) => [id, title]));
}

async function searchCollection(
	cms: CMS,
	collection: SearchCollection,
	query: string,
	locale: Locale,
) {
	const [localized, russian] = await readSourceLocales(
		locale,
		async (locale) => {
			const { docs } = await cms.find({
				...publicRead(),
				collection,
				locale,
				fallbackLocale: false,
				limit: CONTENT_LIMITS.pageSize,
				select: { title: true, slug: true },
				where: {
					or: [
						{ title: { contains: query } },
						...(collection === COLLECTIONS.pages
							? []
							: [{ summary: { contains: query } }]),
					],
				},
			});
			return new Map<number, SearchHit>(docs.map((doc) => [doc.id, doc]));
		},
	);
	// Match in both languages, but display the title in the visitor's language.
	const needsTranslation = [...(russian?.keys() ?? [])].filter(
		(id) => !localized.has(id),
	);
	const needsRussian = russian
		? [...localized.values()]
				.filter(({ id, title }) => !title?.trim() && !russian.has(id))
				.map(({ id }) => id)
		: [];
	const [translations, originals] = await Promise.all([
		readSearchTitles(cms, collection, locale, needsTranslation),
		readSearchTitles(cms, collection, DEFAULT_LOCALE, needsRussian),
	]);
	const hits = new Map([...localized, ...(russian ?? [])]);
	return [...hits.values()].flatMap((doc) => {
		const { value, lang } = localizedText(
			locale,
			localized.get(doc.id)?.title ?? translations.get(doc.id),
			russian?.get(doc.id)?.title ?? originals.get(doc.id),
		);
		return value
			? [{ collection, doc: { ...doc, title: value }, language: lang }]
			: [];
	});
}

export const publishedSearch = cachePublished(
	"publishedSearch",
	async (query: string, locale: Locale) => {
		if (query.length < CONTENT_LIMITS.minimumSearchQuery) {
			return [];
		}
		const cms = await getCMS();
		const matches = await Promise.all(
			[COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS].map((collection) =>
				searchCollection(cms, collection, query, locale),
			),
		);
		return matches.flat();
	},
);
