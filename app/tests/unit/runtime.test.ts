import { describe, expect, it } from "vitest";
import {
	DATABASE_POOLS,
	getRuntimeConfig,
	getServerURL,
	PROCESS_ROLE,
	RUNTIME,
	RUNTIME_ERRORS,
} from "@/config/runtime";

const ENVIRONMENT = {
	NODE_ENV: RUNTIME.production,
	DATABASE_URL: "postgresql://fixture:fixture@localhost:5432/isolated",
	PAYLOAD_SECRET: "isolated-runtime-test-secret-of-at-least-32-characters",
	SERVER_URL: "https://site.example.test",
} as const;

describe("runtime configuration", () => {
	it.each(Object.values(PROCESS_ROLE))(
		"only the dev web process can synchronize schema: %s",
		(role) => {
			const runtime = getRuntimeConfig({
				...ENVIRONMENT,
				NODE_ENV: "development",
				APP_PROCESS_ROLE: role,
			});
			expect(runtime.schemaPush).toBe(role === PROCESS_ROLE.web);
		},
	);
	it("requires real runtime credentials but never echoes them", () => {
		expect(() =>
			getRuntimeConfig({ ...ENVIRONMENT, DATABASE_URL: undefined }),
		).toThrow(RUNTIME_ERRORS.databaseURL);
		expect(() =>
			getRuntimeConfig({ ...ENVIRONMENT, PAYLOAD_SECRET: RUNTIME.buildSecret }),
		).toThrow(RUNTIME_ERRORS.secret);
	});

	it("build uses public placeholders even if local production credentials exist", () => {
		const runtime = getRuntimeConfig({
			...ENVIRONMENT,
			NEXT_PHASE: RUNTIME.buildPhase,
		});
		expect(runtime.databaseURL).toBe(RUNTIME.buildDatabaseURL);
		expect(runtime.secret).toBe(RUNTIME.buildSecret);
		expect(runtime.serverURL).toBe(RUNTIME.buildServerURL);
	});

	it("does not accept HTTP in production", () => {
		expect(() =>
			getServerURL({ ...ENVIRONMENT, SERVER_URL: "http://site.example.test" }),
		).toThrow(RUNTIME_ERRORS.https);
	});

	it.each([
		"ftp://example.test",
		"https://user:secret@example.test",
		"https://example.test/path",
		"https://*.example.test",
		"https://example.test?query=yes",
		"https://example.test#fragment",
	])("rejects a non-canonical URL: %s", (url) => {
		expect(() => getServerURL({ ...ENVIRONMENT, SERVER_URL: url })).toThrow(
			RUNTIME_ERRORS.serverURL,
		);
	});

	it("accepts HTTP on the private dev network", () => {
		expect(
			getServerURL({
				NODE_ENV: "development",
				SERVER_URL: "http://192.168.1.130:3001/",
			}),
		).toBe("http://192.168.1.130:3001");
	});

	it.each(Object.values(PROCESS_ROLE))(
		"limits database connections for %s",
		(role) => {
			const runtime = getRuntimeConfig({
				...ENVIRONMENT,
				APP_PROCESS_ROLE: role,
			});
			expect(runtime.pool.max).toBe(DATABASE_POOLS[role]);
		},
	);
});
