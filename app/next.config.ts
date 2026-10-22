import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";
import { MEDIA_POLICY } from "./src/config/media";

const BUILD_CONCURRENCY = 2;

const nextConfig: NextConfig = {
	distDir: process.env.NEXT_OUTPUT_DIR || ".next",
	experimental: { cpus: BUILD_CONCURRENCY },
	outputFileTracingRoot: process.cwd(),
	images: { deviceSizes: [...MEDIA_POLICY.imageWidths], imageSizes: [] },
};

export default withPayload(nextConfig);
