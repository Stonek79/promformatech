import { COLLECTIONS, SHOWCASE_COLLECTIONS } from "./content";

export const SEARCH_COLLECTIONS = [COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS];
export type SearchCollection = (typeof SEARCH_COLLECTIONS)[number];

export const SEARCH = { delayMs: 180, suggestions: 6 } as const;
export const SEARCH_RANK = {
	exactTitle: 4,
	titlePrefix: 3,
	titleWords: 2,
	descriptionWords: 1,
} as const;
