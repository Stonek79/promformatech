import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import { ROUTES } from "./src/config/content";
import { MEDIA_POLICY } from "./src/config/media";
import { getServerURL, isBuildPhase } from "./src/config/runtime";
import { DEFAULT_LOCALE, SITE_LANGUAGES } from "./src/i18n/config";

const BUILD_CONCURRENCY = 2;
const publicURL =
	process.env.SERVER_URL && !isBuildPhase()
		? new URL(getServerURL())
		: undefined;
const devOrigins = publicURL ? [publicURL.hostname] : [];
const actionOrigins = publicURL ? [publicURL.host] : [];
const russianPrefix = `/${SITE_LANGUAGES[DEFAULT_LOCALE].route}`;
const routedPrefixes = [
	...Object.values(SITE_LANGUAGES).map(({ route }) => route),
	...[ROUTES.admin, ROUTES.api, ROUTES.media, ROUTES.preview].map((route) =>
		route.slice(1),
	),
	"_next",
].join("|");

const nextConfig: NextConfig = {
	output: "standalone",
	distDir: process.env.NEXT_OUTPUT_DIR || ".next",
	allowedDevOrigins: devOrigins,
	experimental: {
		cpus: BUILD_CONCURRENCY,
		serverActions: { allowedOrigins: actionOrigins },
	},
	outputFileTracingRoot: process.cwd(),
	images: { deviceSizes: [...MEDIA_POLICY.imageWidths], imageSizes: [] },
	async redirects() {
		return [
			{
				source: `${russianPrefix}/:path*`,
				destination: "/:path*",
				permanent: true,
			},
		];
	},
	async rewrites() {
		return [
			{ source: ROUTES.home, destination: russianPrefix },
			{
				source: `/:path((?!(?:${routedPrefixes})(?:/|$)).+)`,
				destination: `${russianPrefix}/:path`,
			},
		];
	},
};

export default withPayload(nextConfig);
