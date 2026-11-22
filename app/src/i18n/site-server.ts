import { language } from "next/root-params";
import { DEFAULT_LOCALE } from "./config";
import { localeFromSegment } from "./site-path";

export async function getSiteLocale() {
	return localeFromSegment((await language()) ?? "") ?? DEFAULT_LOCALE;
}
