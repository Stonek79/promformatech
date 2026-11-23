import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { MEDIA_STATUS } from "../../src/config/media";
import { login } from "./support/auth";
import { E2E_ORIGIN as origin } from "./support/config";
import { runWorker } from "./support/jobs";

const MAX_MEDIA_JOB_RUNS = 5;

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
		for (const resource of [
			"pages",
			"products",
			"projects",
			"services",
			"globals/site-settings",
		]) {
			const url = `/api/${resource}`;
			expect((await guest.get(url)).status(), url).toBe(403);
			expect((await request.get(url)).ok(), url).toBe(true);
		}
		let processingStatus: string | undefined;
		for (let attempt = 0; attempt < MAX_MEDIA_JOB_RUNS; attempt++) {
			runWorker();
			const ready = await request.get(`/api/media/${media.id}?draft=true`);
			expect(ready.ok()).toBe(true);
			processingStatus = (await ready.json()).processingStatus;
			if (processingStatus === MEDIA_STATUS.ready) {
				break;
			}
		}
		expect(processingStatus).toBe(MEDIA_STATUS.ready);
		const original = await request.get(`/media/${media.id}/original`);
		expect(await original.body()).toEqual(bytes);
		expect(original.headers()["cache-control"]).toContain("no-store");
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
		const imageURL = `/media/${media.id}/image`;
		const published = await guest.get(imageURL);
		const etag = published.headers().etag;
		expect(etag).toBeTruthy();
		expect(published.headers()["cache-control"]).toBe("private, no-cache");
		const cached = await guest.get(imageURL, {
			headers: { "If-None-Match": etag },
		});
		expect(cached.status()).toBe(304);
		const preview = await request.get(`${imageURL}?draft=true`);
		expect(preview.headers()["cache-control"]).toContain("no-store");
		expect(preview.headers().etag).toBeUndefined();
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
			.poll(async () =>
				(
					await guest.get(imageURL, { headers: { "If-None-Match": etag } })
				).status(),
			)
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
