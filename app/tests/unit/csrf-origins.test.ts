import { describe, expect, it } from "vitest";
import { RUNTIME } from "@/config/runtime";
import { LOCAL_HTTP_AUTH } from "@/config/security";
import { allowedOrigins, localHttpAuthEnabled } from "@/lib/urls";

describe("Payload origins for a local HTTP test server", () => {
	it("requires explicit opt-in for a private development address", () => {
		const local = {
			NODE_ENV: "development",
			SERVER_URL: "http://192.168.1.130:3001",
		};
		expect(localHttpAuthEnabled(local)).toBe(false);
		expect(localHttpAuthEnabled({ ...local, LOCAL_HTTP_AUTH: "true" })).toBe(
			true,
		);
		expect(allowedOrigins(local)).toEqual([local.SERVER_URL]);
	});

	it.each([
		{ NODE_ENV: "production", SERVER_URL: "https://example.test" },
		{ NODE_ENV: "development", SERVER_URL: "https://example.test" },
		{ NODE_ENV: "development", SERVER_URL: "http://example.test" },
		{ NODE_ENV: "development", SERVER_URL: "http://172.32.0.1" },
	])(
		"rejects the exception outside local development: $SERVER_URL",
		(environment) => {
			expect(() =>
				localHttpAuthEnabled({ ...environment, LOCAL_HTTP_AUTH: "true" }),
			).toThrow(LOCAL_HTTP_AUTH.invalidConfiguration);
		},
	);

	it("retains production origin checks and ignores local settings during the build", () => {
		expect(
			localHttpAuthEnabled({
				NODE_ENV: "production",
				SERVER_URL: "https://example.test",
			}),
		).toBe(false);
		expect(
			allowedOrigins({
				NODE_ENV: "production",
				SERVER_URL: "https://example.test",
			}),
		).toEqual(["https://example.test"]);
		expect(
			localHttpAuthEnabled({
				NODE_ENV: "production",
				NEXT_PHASE: RUNTIME.buildPhase,
				LOCAL_HTTP_AUTH: "true",
			}),
		).toBe(false);
	});
});
