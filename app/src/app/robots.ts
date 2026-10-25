import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { ROUTES } from "@/config/content";
import { serverURL } from "@/lib/urls";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
	await connection();
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
