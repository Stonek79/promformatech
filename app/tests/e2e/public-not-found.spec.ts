import { expect, test } from "@playwright/test";
import { TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { LOCALES, SITE_LANGUAGE_QUERY } from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { setTextSize, setTheme } from "./support/appearance";
import { login } from "./support/auth";
import { checkPublicLayout, settlePublicPage } from "./support/public-layout";

const MISSING_PAGE = "/missing-layout-test-page";
const NOT_FOUND_STATUS = 404;
const STREAMED_STATUS = 200;
const SERVER_ERROR_STATUS = 500;
const HEIGHT = 900;
const MISSING_PATHS = [MISSING_PAGE, ROUTES.privacy];
const messages = getMessages().notFound;

test("a retired policy stays out of the public site and the manager’s page list", async ({
	page,
	request,
}) => {
	const query = `/api/pages?where[slug][equals]=${ROUTES.privacy.slice(1)}`;
	expect((await request.get(query)).status()).toBe(403);
	expect(await (await request.get(ROUTES.sitemap)).text()).not.toContain(
		ROUTES.privacy,
	);
	const search = new URLSearchParams({ q: "Политика" });
	await page.goto(`${ROUTES.search}?${search}`);
	await expect(page.locator(`main a[href="${ROUTES.privacy}"]`)).toHaveCount(0);
	const suggestions = await request.get(
		`${ROUTES.searchSuggestions}?${search}`,
	);
	expect(suggestions.ok()).toBe(true);
	expect(await suggestions.text()).not.toContain(ROUTES.privacy);
	await login(page.request);
	const result = await page.request.get(query);
	expect(result.ok()).toBe(true);
	expect((await result.json()).totalDocs).toBe(0);
	await page.goto(
		`/admin/collections/pages?${SITE_LANGUAGE_QUERY}=${LOCALES.ru}`,
	);
	await expect(
		page.getByRole("link", { name: "Контакты", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("link", { name: "Политика обработки данных" }),
	).toHaveCount(0);
});

const VIEWPORTS = [
	{ width: 320, theme: THEMES.dark },
	{ width: 1440, theme: THEMES.light },
] as const;

for (const { width, theme } of VIEWPORTS) {
	test(`missing page ${width} ${theme}`, async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() !== "error") {
				return;
			}
			const expected =
				message.text().includes(`status of ${NOT_FOUND_STATUS}`) &&
				MISSING_PATHS.some((path) => message.location().url.endsWith(path));
			if (!expected) {
				errors.push(message.text());
			}
		});
		page.on("response", (response) => {
			if (response.status() >= SERVER_ERROR_STATUS) {
				errors.push(`${response.status()} ${response.url()}`);
			}
		});
		await page.setViewportSize({ width, height: HEIGHT });
		await page.goto(ROUTES.about);
		await setTheme(page, theme);
		await setTextSize(page, TEXT_SIZES.larger);
		for (const path of MISSING_PATHS) {
			const response = await page.goto(path);
			// Next sends 200 when notFound resolves after streaming has started.
			expect([STREAMED_STATUS, NOT_FOUND_STATUS]).toContain(response?.status());
			await settlePublicPage(page);
			await expect(page.getByRole("heading", { level: 1 })).toHaveText(
				messages.title,
			);
			await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute(
				"content",
				/noindex/,
			);
			await checkPublicLayout(page);
		}
		await page.getByRole("link", { name: messages.home, exact: true }).click();
		await expect(page).toHaveURL(ROUTES.home);
		expect(errors).toEqual([]);
	});
}
