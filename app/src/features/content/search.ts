import { getCMS } from "@/cms/client";
import { COLLECTIONS, CONTENT_LIMITS } from "@/config/content";
import {
	SEARCH_COLLECTIONS,
	SEARCH_RANK,
	type SearchCollection,
} from "@/config/search";
import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/site-path";
import { materialPath, pagePath } from "@/lib/urls";
import { cachePublished } from "./cache";
import { localizedText, readSourceLocales } from "./localized-fields";
import { publicRead } from "./queries";
import type { SearchResult } from "./search-query";

type SearchDocument = {
	readonly id: number;
	readonly slug: string;
	readonly title?: string | null;
	readonly summary?: string | null;
};

type SearchEntry = {
	readonly result: SearchResult;
	readonly titles: readonly string[];
	readonly text: string;
};

function normalize(text: string) {
	return text
		.normalize("NFC")
		.toLowerCase()
		.replaceAll("ё", "е")
		.replace(/[^\p{L}\p{N}\p{M}]+/gu, " ")
		.trim();
}

async function readSearchDocuments(
	cms: Awaited<ReturnType<typeof getCMS>>,
	collection: SearchCollection,
	locale: Locale,
) {
	const documents: SearchDocument[] = [];
	for (let page = 1; ; page += 1) {
		const result = await cms.find({
			...publicRead(),
			depth: 0,
			collection,
			locale,
			fallbackLocale: false,
			page,
			limit: CONTENT_LIMITS.pageSize,
			sort: "id",
			select:
				collection === COLLECTIONS.pages
					? { title: true, slug: true }
					: { title: true, slug: true, summary: true },
		});
		documents.push(...result.docs);
		if (!result.hasNextPage) {
			return documents;
		}
	}
}

function searchEntry(
	collection: SearchCollection,
	locale: Locale,
	doc?: SearchDocument,
	source?: SearchDocument,
): SearchEntry | undefined {
	const slug = doc?.slug ?? source?.slug;
	const { value: title, lang: language } = localizedText(
		locale,
		doc?.title,
		source?.title,
	);
	if (!title || !slug) {
		return undefined;
	}
	const path =
		collection === COLLECTIONS.pages
			? pagePath(slug)
			: materialPath(collection, slug);
	const titles = [normalize(title)];
	if (source?.title && source.title !== title) {
		titles.push(normalize(source.title));
	}
	return {
		result: { href: sitePath(path, locale), title, language, collection },
		titles,
		text: normalize([...titles, doc?.summary, source?.summary].join(" ")),
	};
}

// Cache the published catalog per locale instead of retaining an entry per query.
const searchIndex = cachePublished("searchIndex", async (locale: Locale) => {
	const cms = await getCMS();
	const groups = await Promise.all(
		SEARCH_COLLECTIONS.map(async (collection) => {
			const [localized, russian] = await readSourceLocales(locale, (locale) =>
				readSearchDocuments(cms, collection, locale),
			);
			const originals = new Map(russian?.map((doc) => [doc.id, doc]));
			const documents = new Map(localized.map((doc) => [doc.id, doc]));
			const ids = new Set([...documents.keys(), ...originals.keys()]);
			return [...ids].flatMap((id) => {
				const entry = searchEntry(
					collection,
					locale,
					documents.get(id),
					originals.get(id),
				);
				return entry ? [entry] : [];
			});
		}),
	);
	return groups.flat();
});

function relevance(
	entry: SearchEntry,
	phrase: string,
	words: readonly string[],
) {
	if (entry.titles.includes(phrase)) {
		return SEARCH_RANK.exactTitle;
	}
	if (entry.titles.some((title) => title.startsWith(phrase))) {
		return SEARCH_RANK.titlePrefix;
	}
	if (
		entry.titles.some((title) => words.every((word) => title.includes(word)))
	) {
		return SEARCH_RANK.titleWords;
	}
	return words.every((word) => entry.text.includes(word))
		? SEARCH_RANK.descriptionWords
		: 0;
}

export async function publishedSearch(query: string, locale: Locale) {
	const phrase = normalize(query);
	if (phrase.length < CONTENT_LIMITS.minimumSearchQuery) {
		return [];
	}
	const words = phrase.split(" ");
	const entries = await searchIndex(locale);
	return entries
		.map((entry) => ({
			result: entry.result,
			rank: relevance(entry, phrase, words),
		}))
		.filter(({ rank }) => rank > 0)
		.sort((left, right) => right.rank - left.rank)
		.map(({ result }) => result);
}
