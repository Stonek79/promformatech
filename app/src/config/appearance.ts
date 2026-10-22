export const THEMES = { light: "light", dark: "dark", system: "auto" } as const;
export type ThemePreference = (typeof THEMES)[keyof typeof THEMES];
export const TEXT_SIZES = {
	standard: "standard",
	large: "large",
	larger: "larger",
} as const;
export type TextSize = (typeof TEXT_SIZES)[keyof typeof TEXT_SIZES];

export const NEXT_TEXT_SIZE = {
	[TEXT_SIZES.standard]: TEXT_SIZES.large,
	[TEXT_SIZES.large]: TEXT_SIZES.larger,
	[TEXT_SIZES.larger]: TEXT_SIZES.standard,
} as const satisfies Record<TextSize, TextSize>;

export const APPEARANCE = {
	siteThemeCookie: "pf-site-theme",
	siteSizeCookie: "pf-site-text-size",
	adminSizeCookie: "pf-admin-text-size",
	themeAttribute: "data-site-theme",
	sizeAttribute: "data-text-size",
	cookieMaxAge: 31_536_000,
	darkMedia: "(prefers-color-scheme: dark)",
} as const;

export const THEME_OPTIONS = [
	THEMES.light,
	THEMES.dark,
	THEMES.system,
] as const;
export const TEXT_SIZE_OPTIONS = [
	TEXT_SIZES.standard,
	TEXT_SIZES.large,
	TEXT_SIZES.larger,
] as const;

export function parseTheme(value: unknown): ThemePreference {
	return THEME_OPTIONS.find((option) => option === value) ?? THEMES.system;
}

export function parseTextSize(value: unknown): TextSize {
	return (
		TEXT_SIZE_OPTIONS.find((option) => option === value) ?? TEXT_SIZES.standard
	);
}
