import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";

export type LocalizedText = { readonly value?: string; readonly lang: Locale };

export function readSourceLocales<T>(
	locale: Locale,
	load: (locale: Locale) => Promise<T>,
) {
	return Promise.all([
		load(locale),
		locale === DEFAULT_LOCALE ? undefined : load(DEFAULT_LOCALE),
	] as const);
}

export function localizedText(
	locale: Locale,
	value?: string | null,
	source?: string | null,
): LocalizedText {
	const translation = value?.trim();
	return translation
		? { value: translation, lang: locale }
		: { value: source?.trim() || undefined, lang: DEFAULT_LOCALE };
}

export function matchRows<T extends { id?: string | null }, Result>(
	rows: T[] | null | undefined,
	sourceRows: T[] | null | undefined,
	resolve: (row: T, source?: T) => Result,
) {
	const byId = new Map(sourceRows?.map((row) => [row.id, row]));
	return (rows ?? []).map((row) =>
		resolve(row, row.id ? byId.get(row.id) : undefined),
	);
}
