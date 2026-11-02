import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { login } from "./support/auth";
import { E2E_ORIGIN as origin } from "./support/config";

test("global contacts have a private draft and published snapshot", async ({
	request,
	playwright,
}) => {
	await login(request);
	const guest = await playwright.request.newContext({ baseURL: origin });
	try {
		const before = await (await guest.get("/api/globals/site-settings")).json();
		expect(
			(
				await request.post("/api/globals/site-settings?draft=true", {
					data: { phone: "+7 999 123-45-67", _status: "draft" },
				})
			).ok(),
		).toBe(true);
		expect(
			(await (await guest.get("/api/globals/site-settings")).json()).phone,
		).toBe(before.phone);
		expect(
			(
				await request.post("/api/globals/site-settings", {
					data: { phone: "+7 999 123-45-67", _status: "published" },
				})
			).ok(),
		).toBe(true);
		expect(
			(await (await guest.get("/api/globals/site-settings")).json()).phone,
		).toBe("+7 999 123-45-67");
		await request.post("/api/globals/site-settings", {
			data: { _status: "draft", phone: "UNPUBLISHED" },
		});
		expect(
			(await (await guest.get("/api/globals/site-settings")).json()).phone,
		).toBeUndefined();
		await request.post("/api/globals/site-settings", {
			data: { _status: "published", phone: "+7 999 123-45-67" },
		});
	} finally {
		await guest.dispose();
	}
});

test("upload processing, originals, published file access and revocation", async ({
	request,
	playwright,
}) => {
	await login(request);
	const guest = await playwright.request.newContext({ baseURL: origin });
	try {
		const bytes = await readFile("seed-assets/about.jpg");
		const upload = await request.post("/api/media?draft=true", {
			multipart: {
				_payload: JSON.stringify({ title: "Проверка файла", alt: "Робот" }),
				file: { name: "test.jpg", mimeType: "image/jpeg", buffer: bytes },
			},
		});
		expect(upload.status()).toBe(201);
		const { doc: media } = await upload.json();
		expect((await guest.get(`/media/${media.id}/image`)).status()).toBe(404);
		const worker = spawnSync("pnpm", ["worker:once"], {
			env: process.env,
			encoding: "utf8",
			timeout: 60000,
		});
		expect(worker.status, worker.stderr).toBe(0);
		const ready = await (
			await request.get(`/api/media/${media.id}?draft=true`)
		).json();
		expect(ready.processingStatus).toBe("ready");
		const original = await request.get(`/media/${media.id}/original`);
		expect(await original.body()).toEqual(bytes);
		expect((await guest.get(`/media/${media.id}/original`)).status()).toBe(404);
		const page = await request.post("/api/pages", {
			data: {
				title: "Публичный файл",
				slug: "test-media",
				kind: "content",
				_status: "published",
				blocks: [{ blockType: "textImage", image: media.id, visible: true }],
			},
		});
		expect(page.status()).toBe(201);
		const { doc } = await page.json();
		await expect
			.poll(async () => (await guest.get(`/media/${media.id}/image`)).status())
			.toBe(200);
		const partial = await guest.get(`/media/${media.id}/image`, {
			headers: { Range: "bytes=0-9" },
		});
		expect(partial.status()).toBe(206);
		expect((await partial.body()).length).toBe(10);
		expect(
			(
				await request.patch(`/api/media/${media.id}`, {
					data: { archived: true },
				})
			).status(),
		).toBe(400);
		expect(
			(
				await request.patch(`/api/pages/${doc.id}`, {
					data: { _status: "draft" },
				})
			).ok(),
		).toBe(true);
		await expect
			.poll(async () => (await guest.get(`/media/${media.id}/image`)).status())
			.toBe(404);
	} finally {
		await guest.dispose();
	}
});

test("removed intake endpoints are unavailable", async ({ request }) => {
	for (const route of ["/api/inquiries", "/api/leads"]) {
		expect(
			(await request.post(route, { data: { name: "Unused" } })).status(),
		).toBe(404);
	}
});
