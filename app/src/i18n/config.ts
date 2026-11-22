export const LOCALES = { ru: "ru", en: "en", de: "de" } as const;
export type Locale = (typeof LOCALES)[keyof typeof LOCALES];
export const DEFAULT_LOCALE = LOCALES.ru;
export const SITE_LANGUAGE_QUERY = "locale";
export const OPEN_GRAPH_LOCALES = {
	[LOCALES.ru]: "ru_RU",
	[LOCALES.en]: "en_US",
	[LOCALES.de]: "de_DE",
} as const satisfies Record<Locale, string>;

export const SITE_LANGUAGES = {
	[LOCALES.ru]: { route: "ru", code: "RU", name: "Русский" },
	[LOCALES.en]: { route: "en", code: "EN", name: "English" },
	[LOCALES.de]: { route: "de", code: "DE", name: "Deutsch" },
} as const satisfies Record<
	Locale,
	{ route: string; code: string; name: string }
>;

export function parseLocale(value: unknown): Locale {
	return (
		Object.values(LOCALES).find((locale) => locale === value) ?? DEFAULT_LOCALE
	);
}
