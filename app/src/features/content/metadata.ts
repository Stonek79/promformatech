import type { Metadata } from "next";
import { MEDIA_DELIVERY, mediaURL } from "@/config/media";
import { serverURL } from "@/lib/urls";
import type {
	Page,
	Product,
	Project,
	Service,
	SiteSetting,
} from "@/payload-types";

export function contentMetadata(
	content: Page | Product | Project | Service | null,
	settings: SiteSetting,
	preview: boolean,
): Metadata {
	if (!content) {
		return {
			title: "Страница не найдена",
			robots: { index: false, follow: false },
		};
	}
	const title =
		content.seo?.title || `${content.title} — ${settings.companyName}`;
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
				: undefined,
		openGraph: {
			title,
			description,
			locale: "ru_RU",
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
