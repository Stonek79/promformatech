import type { NextConfig } from "next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@payloadcms/next/withPayload", () => ({
	withPayload: (config: NextConfig) => config,
}));

const ENVIRONMENT = { serverURL: "SERVER_URL" } as const;
const SERVER_CASES = [
	{
		name: "localhost",
		url: "http://localhost:3000",
		hostname: "localhost",
		host: "localhost:3000",
	},
	{
		name: "домашняя сеть",
		url: "http://192.168.1.130:3001",
		hostname: "192.168.1.130",
		host: "192.168.1.130:3001",
	},
	{
		name: "HTTPS-домен",
		url: "https://preview.example.com",
		hostname: "preview.example.com",
		host: "preview.example.com",
	},
	{
		name: "HTTPS с отдельным портом",
		url: "https://preview.example.com:8443/",
		hostname: "preview.example.com",
		host: "preview.example.com:8443",
	},
] as const;
const UNCONFIGURED_URLS = [undefined, ""] as const;
const INVALID_URL = "http://";

beforeEach(() => {
	vi.resetModules();
});

afterEach(() => {
	vi.unstubAllEnvs();
});

describe("разрешённые адреса Next.js", () => {
	it.each(SERVER_CASES)(
		"$name: разрешён только выбранный хост",
		async (server) => {
			vi.stubEnv(ENVIRONMENT.serverURL, server.url);
			const { default: config } = await import("../../next.config");

			expect(config.allowedDevOrigins).toEqual([server.hostname]);
			expect(config.experimental?.serverActions).toEqual({
				allowedOrigins: [server.host],
			});
		},
	);

	it.each(UNCONFIGURED_URLS)(
		"не добавляет разрешений без SERVER_URL (%s)",
		async (url) => {
			vi.stubEnv(ENVIRONMENT.serverURL, url);
			const { default: config } = await import("../../next.config");

			expect(config.allowedDevOrigins).toEqual([]);
			expect(config.experimental?.serverActions).toEqual({
				allowedOrigins: [],
			});
		},
	);

	it("отклоняет некорректный URL при загрузке конфигурации", async () => {
		vi.stubEnv(ENVIRONMENT.serverURL, INVALID_URL);

		await expect(import("../../next.config")).rejects.toThrow(Error);
	});
});
