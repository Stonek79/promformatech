import type { Metadata } from "next";
import { mediaURL } from "@/config/media";
import { MEDIA_DELIVERY } from "@/config/media-assets";
import { DEFAULT_LOCALE, type Locale, OPEN_GRAPH_LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { siteBrandName } from "@/i18n/site-copy";
import { serverURL } from "@/lib/urls";
import type { Page, SiteSetting } from "@/payload-types";
import { localizedText } from "./localized-fields";

type TextMetadata = Pick<Page, "title" | "seo">;

export function localizedMetadataCopy(
	content: TextMetadata,
	source: TextMetadata | undefined,
	locale: Locale,
): TextMetadata {
	return {
		title: localizedText(locale, content.title, source?.title).value,
		seo: {
			...content.seo,
			title: localizedText(locale, content.seo?.title, source?.seo?.title)
				.value,
			description: localizedText(
				locale,
				content.seo?.description,
				source?.seo?.description,
			).value,
		},
	};
}

export function contentMetadata(
	content: TextMetadata | null,
	settings: SiteSetting,
	preview: boolean,
	locale: Locale,
): Metadata {
	if (!content) {
		return {
			title: getMessages(locale).notFound.title,
			robots: { index: false, follow: false },
		};
	}
	const brand = siteBrandName(settings.companyName, locale);
	const title =
		content.seo?.title ||
		(content.title ? `${content.title} — ${brand}` : brand);
	const description =
		content.seo?.description ||
		settings.seo?.description ||
		settings.tagline ||
		undefined;
	const image = content.seo?.image || settings.seo?.image;
	return {
		title,
		description,
		robots:
			preview || content.seo?.noIndex
				? { index: false, follow: false }
				: locale === DEFAULT_LOCALE
					? undefined
					: { index: false, follow: true },
		openGraph: {
			title,
			description,
			locale: OPEN_GRAPH_LOCALES[locale],
			type: "website",
			images:
				typeof image === "object" && image
					? [
							new URL(
								mediaURL(image.id, MEDIA_DELIVERY.image),
								serverURL(),
							).toString(),
						]
					: undefined,
		},
	};
}
