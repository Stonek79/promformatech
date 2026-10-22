import type { MetadataRoute } from "next";
import { ROUTES } from "@/config/content";
import { serverURL } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: ROUTES.home,
			disallow: [
				ROUTES.admin,
				ROUTES.api,
				ROUTES.preview,
				ROUTES.search,
				ROUTES.uiKit,
			],
		},
		sitemap: new URL(ROUTES.sitemap, serverURL()).toString(),
	};
}
