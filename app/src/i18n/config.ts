export const LOCALES = { ru: "ru" } as const;
export type Locale = (typeof LOCALES)[keyof typeof LOCALES];
export const DEFAULT_LOCALE = LOCALES.ru;

export function parseLocale(value: unknown): Locale {
	return (
		Object.values(LOCALES).find((locale) => locale === value) ?? DEFAULT_LOCALE
	);
}
