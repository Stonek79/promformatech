import { ROUTES } from "@/config/content";
import { type Locale, SITE_LANGUAGE_QUERY } from "@/i18n/config";
import { serverURL } from "@/lib/urls";

type PreviewTarget = {
	readonly collection?: string;
	readonly id?: unknown;
	readonly global?: string;
	readonly locale?: Locale;
};

export function previewURL({ collection, id, global, locale }: PreviewTarget) {
	const url = new URL(ROUTES.preview, serverURL());
	if (collection) {
		url.searchParams.set("collection", collection);
	}
	if (typeof id === "string" || typeof id === "number") {
		url.searchParams.set("id", String(id));
	}
	if (global) {
		url.searchParams.set("global", global);
	}
	if (locale) {
		url.searchParams.set(SITE_LANGUAGE_QUERY, locale);
	}
	return url.toString();
}
