import { ROUTES } from "@/config/content";
import { DEFAULT_LOCALE, LOCALES, type Locale, SITE_LANGUAGES } from "./config";

const SITE_LOCALES = Object.values(LOCALES);
const SERVICE_PREFIXES = [
	ROUTES.admin,
	ROUTES.api,
	ROUTES.media,
	ROUTES.preview,
];

export function localeFromSegment(segment: string) {
	return SITE_LOCALES.find(
		(locale) => SITE_LANGUAGES[locale].route === segment,
	);
}

export function splitSitePath(pathname: string) {
	const [, segment, ...rest] = pathname.split("/");
	const locale = localeFromSegment(segment);
	return {
		locale,
		pathname: locale ? `/${rest.join("/")}` : pathname,
	};
}

export function sitePath(href: string, locale: Locale) {
	if (!href.startsWith("/") || href.startsWith("//") || href.includes("\\")) {
		return href;
	}
	const suffixStart = href.search(/[?#]/);
	const pathname = suffixStart < 0 ? href : href.slice(0, suffixStart);
	const suffix = suffixStart < 0 ? "" : href.slice(suffixStart);
	const { pathname: path } = splitSitePath(pathname);
	if (
		SERVICE_PREFIXES.some(
			(prefix) => path === prefix || path.startsWith(`${prefix}/`),
		) ||
		path.includes(".")
	) {
		return href;
	}
	const prefix =
		locale === DEFAULT_LOCALE ? "" : `/${SITE_LANGUAGES[locale].route}`;
	return `${prefix && path === ROUTES.home ? prefix : prefix + path}${suffix}`;
}
