import { isPublicHref, serverURL } from "@/lib/urls";
import type { SiteSetting } from "@/payload-types";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getMessages } from "./messages";
import { sitePath } from "./site-path";

export function siteBrandName(name: string, locale: Locale) {
	return name === getMessages().common.brand
		? getMessages(locale).common.brand
		: name;
}

export function interfaceLabels(settings: SiteSetting, locale: Locale) {
	const defaults = getMessages(locale).labels;
	if (locale !== DEFAULT_LOCALE) {
		return defaults;
	}
	const labels = { ...defaults };
	for (const key of Object.keys(defaults) as (keyof typeof defaults)[]) {
		labels[key] = settings.labels?.[key] || defaults[key];
	}
	return labels;
}

function localizeLink(href: string, url: URL, origin: string, locale: Locale) {
	if (url.origin !== origin || href.startsWith("#")) {
		return href;
	}
	const path = `${url.pathname}${url.search}${url.hash}`;
	const localized = sitePath(path, locale);
	return localized === path ? href : localized;
}

export function localizedPublicHref(href: string, locale: Locale) {
	const origin = serverURL();
	return localizeLink(href, new URL(href, origin), origin, locale);
}

export function navigationLink(
	item: Readonly<{
		id?: string | null;
		label?: string | null;
		labelLanguage: Locale;
		url?: string | null;
	}>,
	locale: Locale,
) {
	if (!item.label || !isPublicHref(item.url)) {
		return [];
	}
	return [
		{
			id: item.id,
			url: localizedPublicHref(item.url, locale),
			label: item.label,
			lang: item.labelLanguage,
		},
	];
}
