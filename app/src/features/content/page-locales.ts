import type { Locale } from "@/i18n/config";
import type { Page } from "@/payload-types";
import { localizedText, readSourceLocales } from "./localized-fields";
import { localizedMetadataCopy } from "./metadata";

export type LocalizedPage = {
	readonly page: Page;
	readonly source?: Page;
	readonly locale: Locale;
};

// Legacy content sometimes uses a dash or a dot to leave the heading blank.
const HEADING_PLACEHOLDER = /^[\p{Dash_Punctuation}.…\s]+$/u;

function editorialHeading(value?: string | null) {
	return value && !HEADING_PLACEHOLDER.test(value) ? value : undefined;
}

export async function readPageLocales(
	locale: Locale,
	load: (locale: Locale) => Promise<Page | null>,
): Promise<LocalizedPage | null> {
	const [page, source] = await readSourceLocales(locale, load);
	return page ? { page, source: source ?? undefined, locale } : null;
}

export function pageHeading({ page, source, locale }: LocalizedPage) {
	const heading = localizedText(
		locale,
		editorialHeading(page.heading),
		editorialHeading(source?.heading),
	);
	return heading.value
		? heading
		: localizedText(locale, page.title, source?.title);
}

export function pageMetadataCopy(document: LocalizedPage | null) {
	if (!document) {
		return null;
	}
	const { page, source, locale } = document;
	return localizedMetadataCopy(page, source, locale);
}
