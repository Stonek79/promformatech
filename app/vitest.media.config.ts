import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
	test: {
		include: ["tests/media/**/*.test.ts"],
		maxWorkers: 1,
		testTimeout: 30_000,
	},
});
