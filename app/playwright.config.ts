import { defineConfig } from "@playwright/test";
import { E2E_HEADERS, E2E_ORIGIN } from "./tests/e2e/support/config";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	expect: { timeout: 15_000 },
	use: {
		baseURL: E2E_ORIGIN,
		extraHTTPHeaders: E2E_HEADERS,
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
	},
});
