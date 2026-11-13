import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { login } from "./support/auth";
import { E2E_HEADERS } from "./support/config";

const IMAGE = "seed-assets/about.jpg";
const MEDIA = "/api/media";
const OWNER_NAME = "Название от менеджера";

async function upload(page: import("@playwright/test").Page, name: string) {
	const bytes = await readFile(IMAGE);
	const response = await page.request.post(`${MEDIA}?draft=true`, {
		headers: E2E_HEADERS,
		multipart: {
			_payload: "{}",
			file: { name, mimeType: "image/jpeg", buffer: bytes },
		},
	});
	expect(response.status()).toBe(201);
	return (await response.json()).doc;
}

async function processMedia(page: import("@playwright/test").Page, id: number) {
	const maximumAttempts = 5;
	for (let attempt = 0; attempt < maximumAttempts; attempt++) {
		const worker = spawnSync("pnpm", ["worker:once"], {
			env: process.env,
			encoding: "utf8",
			timeout: 60_000,
		});
		expect(worker.status, worker.stderr).toBe(0);
		const result = await page.request.get(`${MEDIA}/${id}?draft=true`, {
			headers: E2E_HEADERS,
		});
		if ((await result.json()).processingStatus === "ready") {
			return;
		}
	}
	throw new Error("Test image did not finish processing");
}

async function prepare(page: import("@playwright/test").Page) {
	await login(page.request);
	await page.context().setExtraHTTPHeaders({});
}

async function clickPublish(
	page: import("@playwright/test").Page,
	collection: string,
) {
	const pending = page.waitForResponse(
		(response) =>
			new URL(response.url()).pathname === `/api/${collection}/1` &&
			response.request().method() === "PATCH",
	);
	await page
		.getByRole("button", { name: "Опубликовать изменения", exact: true })
		.click();
	return pending;
}

test("selecting a file fills its title without replacing the manager's choice", async ({
	page,
}) => {
	await prepare(page);
	await page.goto("/admin/collections/media/create");
	const title = page.getByRole("textbox", { name: /^Название/ }).first();
	const file = page.locator('input[type="file"]');
	await file.setInputFiles({
		name: "Пресс_форма.jpg",
		mimeType: "image/jpeg",
		buffer: await readFile(IMAGE),
	});
	await expect(title).toHaveValue("Пресс форма");
	await page.locator(".file-field__remove").click();
	await file.setInputFiles({
		name: "Другое_фото.jpg",
		mimeType: "image/jpeg",
		buffer: await readFile(IMAGE),
	});
	await expect(title).toHaveValue("Другое фото");
	await title.fill(OWNER_NAME);
	await page.locator(".file-field__remove").click();
	await file.setInputFiles({
		name: "Третье_фото.jpg",
		mimeType: "image/jpeg",
		buffer: await readFile(IMAGE),
	});
	await expect(title).toHaveValue(OWNER_NAME);
	const saved = page.waitForResponse(
		(response) =>
			new URL(response.url()).pathname === MEDIA &&
			response.request().method() === "POST",
	);
	await page
		.getByRole("button", { name: "Сохранить черновик", exact: true })
		.click();
	expect((await saved).status()).toBe(201);
	await expect(
		page.getByRole("textbox", { name: /^Название/ }).first(),
	).toHaveValue(OWNER_NAME);
});

for (const collection of ["services", "products"]) {
	test(`publishes ${collection} with a previously untitled photo`, async ({
		page,
		browser,
	}) => {
		await prepare(page);
		const image = await upload(page, `legacy_${collection}.jpg`);
		expect(image.title).toBe(`legacy ${collection}`);
		const cleared = await page.request.patch(
			`${MEDIA}/${image.id}?draft=true`,
			{ headers: E2E_HEADERS, data: { title: "" } },
		);
		expect(cleared.status()).toBe(200);
		await processMedia(page, image.id);
		const draft = await page.request.patch(`/api/${collection}/1?draft=true`, {
			headers: E2E_HEADERS,
			data: { featuredImage: image.id, _status: "draft" },
		});
		expect(draft.status()).toBe(200);
		const visitor = await browser.newContext();
		try {
			const hidden = await visitor.request.get(
				`http://127.0.0.1:3100/media/${image.id}/image`,
			);
			expect(hidden.status()).toBe(404);
			await page.goto(`/admin/collections/${collection}/1`);
			const title = page.getByRole("textbox", { name: /^Название/ }).first();
			const original = await title.inputValue();
			const response = await clickPublish(page, collection);
			expect(response.status()).toBe(200);
			await expect(title).toHaveValue(original);
			const media = await (
				await page.request.get(`${MEDIA}/${image.id}?draft=true`, {
					headers: E2E_HEADERS,
				})
			).json();
			expect(media.title).toBe(`legacy ${collection}`);
			expect(media._status).toBe("published");
			await expect
				.poll(async () =>
					(
						await visitor.request.get(
							`http://127.0.0.1:3100/media/${image.id}/image`,
						)
					).status(),
				)
				.toBe(200);
		} finally {
			await visitor.close();
		}
	});
}

test("an unprocessed photo is identified without marking the material title invalid", async ({
	page,
}) => {
	await prepare(page);
	const image = await upload(page, "ожидающая_обработки.jpg");
	const draft = await page.request.patch("/api/services/1?draft=true", {
		headers: E2E_HEADERS,
		data: { featuredImage: image.id, _status: "draft" },
	});
	expect(draft.status()).toBe(200);
	await page.goto("/admin/collections/services/1");
	const title = page.getByRole("textbox", { name: /^Название/ }).first();
	const original = await title.inputValue();
	const response = await clickPublish(page, "services");
	expect(response.status()).toBe(400);
	const error = await response.json();
	expect(error.errors[0].message).toContain(image.title);
	await expect(
		page
			.getByText(`Файл «${image.title}» ещё не готов.`, { exact: false })
			.first(),
	).toBeVisible();
	await expect(title).toHaveValue(original);
	await expect(
		page.getByText("Это обязательное поле.", { exact: true }),
	).toHaveCount(0);
});
