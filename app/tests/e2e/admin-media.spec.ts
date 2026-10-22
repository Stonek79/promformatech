import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { expect, publish, saveDraft, test } from "./support/admin";
import { E2E_HEADERS } from "./support/config";
import { runWorker } from "./support/jobs";
import { createVideoFixture } from "./support/video";

const MEDIA = {
	list: "/admin/collections/media",
	create: "/admin/collections/media/create",
	api: "/api/media",
	pages: "/api/pages",
	image: "seed-assets/about.jpg",
	title: "Фотография менеджера",
	alt: "Фото перед изменением",
	draftAlt: "Описание фото в черновике",
	workerTimeout: 60_000,
} as const;

test("manager uploads a photo, sees processing, downloads the original and drafts metadata privately", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	await page.goto(MEDIA.list);
	await page.locator(`a[href="${MEDIA.create}"]`).first().click();
	await page.getByRole("textbox", { name: /^Название/ }).fill(MEDIA.title);
	await page
		.getByRole("textbox", { name: "Что изображено", exact: true })
		.fill(MEDIA.alt);
	await page.locator('input[type="file"]').setInputFiles(MEDIA.image);
	await saveDraft(page, MEDIA.api);
	await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+$/);
	const id = new URL(page.url()).pathname.split("/").at(-1);
	const api = `${MEDIA.api}/${id}`;
	await expect(page.getByText(/^Ожидает обработки —/)).toBeVisible();
	const worker = spawnSync("pnpm", ["worker:once"], {
		env: process.env,
		encoding: "utf8",
		timeout: MEDIA.workerTimeout,
	});
	expect(worker.status, worker.stderr).toBe(0);
	await expect(
		page.getByText("Готово к публикации", { exact: true }),
	).toBeVisible();
	const downloadEvent = page.waitForEvent("download");
	await page
		.getByRole("link", { name: "Скачать исходный файл", exact: true })
		.click();
	const download = await downloadEvent;
	const downloadedPath = await download.path();
	expect(downloadedPath).not.toBeNull();
	if (!downloadedPath) {
		throw new Error("Original file download did not complete");
	}
	expect(await readFile(downloadedPath)).toEqual(await readFile(MEDIA.image));
	const created = await page.request.post(MEDIA.pages, {
		headers: E2E_HEADERS,
		data: {
			title: "Материал с фото",
			slug: "manager-photo",
			kind: "content",
			_status: "published",
			blocks: [{ blockType: "textImage", image: Number(id), visible: true }],
		},
	});
	expect(created.status()).toBe(201);
	await visitor.goto("/manager-photo");
	await expect(
		visitor.getByRole("img", { name: MEDIA.alt, exact: true }),
	).toBeVisible();
	await page.reload();
	await page
		.getByRole("textbox", { name: "Что изображено", exact: true })
		.fill(MEDIA.draftAlt);
	await saveDraft(page, api);
	await page.reload();
	await expect(
		page.getByRole("textbox", { name: "Что изображено", exact: true }),
	).toHaveValue(MEDIA.draftAlt);
	await visitor.reload();
	await expect(
		visitor.getByRole("img", { name: MEDIA.alt, exact: true }),
	).toBeVisible();
	await expect(
		visitor.getByRole("img", { name: MEDIA.draftAlt, exact: true }),
	).toHaveCount(0);
	await publish(page, api);
	const published = await (
		await page.request.get(`${api}?draft=false`, { headers: E2E_HEADERS })
	).json();
	expect(published.alt).toBe(MEDIA.draftAlt);
	await visitor.reload();
	await expect(
		visitor.getByRole("img", { name: MEDIA.draftAlt, exact: true }),
	).toBeVisible();
});

test("manager uploads video with captions and publishes a playable optimized file", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const source = await createVideoFixture();
	try {
		await page.goto(MEDIA.create);
		await page
			.getByRole("textbox", { name: /^Название/ })
			.fill("Видео менеджера");
		await page
			.getByRole("textbox", {
				name: "Субтитры WebVTT (для видео с речью)",
				exact: true,
			})
			.fill("WEBVTT\n\n00:00.000 --> 00:00.900\nПроверка субтитров\n");
		await page.locator('input[type="file"]').setInputFiles(source.file);
		await saveDraft(page, MEDIA.api);
		await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+$/);
		const id = new URL(page.url()).pathname.split("/").at(-1);
		runWorker();
		await expect(
			page.getByText("Готово к публикации", { exact: true }),
		).toBeVisible();
		const created = await page.request.post(MEDIA.pages, {
			headers: E2E_HEADERS,
			data: {
				title: "Материал с видео",
				slug: "manager-video",
				kind: "content",
				_status: "published",
				blocks: [{ blockType: "video", video: Number(id), visible: true }],
			},
		});
		expect(created.status()).toBe(201);
		await visitor.goto("/manager-video");
		await expect(visitor.locator("video")).toHaveAttribute(
			"aria-label",
			"Видео менеджера",
		);
		const videoURL = await visitor.locator("video source").getAttribute("src");
		const captionsURL = await visitor
			.locator("video track")
			.getAttribute("src");
		expect(videoURL).toBeTruthy();
		expect(captionsURL).toBeTruthy();
		const partial = await visitor.request.get(videoURL || "", {
			headers: { Range: "bytes=0-15" },
		});
		expect(partial.status()).toBe(206);
		expect((await partial.body()).length).toBe(16);
		expect(
			await (await visitor.request.get(captionsURL || "")).text(),
		).toContain("Проверка субтитров");
		await expect(
			page.getByRole("link", { name: "Скачать исходный файл", exact: true }),
		).toBeVisible();
	} finally {
		await source.cleanup();
	}
});
