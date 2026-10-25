import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import { MEDIA_POLICY } from "./src/config/media";
import { getServerURL, isBuildPhase } from "./src/config/runtime";

const BUILD_CONCURRENCY = 2;
const publicURL =
	process.env.SERVER_URL && !isBuildPhase()
		? new URL(getServerURL())
		: undefined;
const devOrigins = publicURL ? [publicURL.hostname] : [];
const actionOrigins = publicURL ? [publicURL.host] : [];

const nextConfig: NextConfig = {
	distDir: process.env.NEXT_OUTPUT_DIR || ".next",
	allowedDevOrigins: devOrigins,
	experimental: {
		cpus: BUILD_CONCURRENCY,
		serverActions: { allowedOrigins: actionOrigins },
	},
	outputFileTracingRoot: process.cwd(),
	images: { deviceSizes: [...MEDIA_POLICY.imageWidths], imageSizes: [] },
};

export default withPayload(nextConfig);
