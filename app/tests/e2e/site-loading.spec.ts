import { ROUTES } from "../../src/config/content";
import { expect, test } from "./support/admin";

const VIEWPORT = { width: 390, height: 844 };
const MIN_CONTENT_HEIGHT_RATIO = 0.65;

test("server shell reserves content space and respects reduced motion", async ({
	browser,
	baseURL,
	page,
}, testInfo) => {
	// Freeze the real streamed fallback before React replaces it with content.
	const context = await browser.newContext({
		baseURL,
		javaScriptEnabled: false,
		reducedMotion: "reduce",
		viewport: VIEWPORT,
	});
	try {
		const initialPage = await context.newPage();
		await initialPage.goto(ROUTES.projects);
		const loading = initialPage.getByRole("status", {
			name: "Загрузка страницы",
		});
		await expect(loading).toBeVisible();
		const content = await initialPage.locator("main:visible").boundingBox();
		expect(content?.height).toBeGreaterThanOrEqual(
			VIEWPORT.height * MIN_CONTENT_HEIGHT_RATIO,
		);
		await expect(loading.locator('[aria-hidden="true"]').first()).toHaveCSS(
			"animation-name",
			"none",
		);
		await initialPage.screenshot({
			path: testInfo.outputPath("loading-mobile.png"),
		});
	} finally {
		await context.close();
	}
	await page.setViewportSize(VIEWPORT);
	await page.goto(ROUTES.projects);
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await expect(
		page.getByRole("status", { name: "Загрузка страницы" }),
	).toHaveCount(0);
	const content = await page.locator("main").boundingBox();
	const footer = await page.locator("footer").boundingBox();
	expect(content?.height).toBeGreaterThanOrEqual(
		VIEWPORT.height * MIN_CONTENT_HEIGHT_RATIO,
	);
	expect(footer?.y).toBeGreaterThanOrEqual(
		(content?.y ?? 0) + (content?.height ?? 0),
	);
});
