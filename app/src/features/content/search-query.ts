import { CONTENT_LIMITS } from "@/config/content";
import { SEARCH_COLLECTIONS, type SearchCollection } from "@/config/search";
import { LOCALES, type Locale } from "@/i18n/config";

export type SearchResult = {
	readonly href: string;
	readonly title: string;
	readonly language: Locale;
	readonly collection: SearchCollection;
};

export function readSearchQuery(value: unknown) {
	return typeof value === "string"
		? value.trim().slice(0, CONTENT_LIMITS.searchQuery)
		: "";
}

export function isSearchResult(value: unknown): value is SearchResult {
	return (
		typeof value === "object" &&
		value !== null &&
		"href" in value &&
		typeof value.href === "string" &&
		value.href.startsWith("/") &&
		!value.href.startsWith("//") &&
		!value.href.includes("\\") &&
		"title" in value &&
		typeof value.title === "string" &&
		"language" in value &&
		Object.values(LOCALES).some((locale) => locale === value.language) &&
		"collection" in value &&
		SEARCH_COLLECTIONS.some((collection) => collection === value.collection)
	);
}
