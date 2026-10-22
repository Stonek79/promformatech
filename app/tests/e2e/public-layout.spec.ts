import { TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { CONTENT_LIMITS, ROUTES } from "../../src/config/content";
import { getMessages } from "../../src/i18n/messages";
import { expect, test } from "./support/admin";
import { setTextSize, setTheme } from "./support/appearance";
import {
	createLayoutProject,
	deleteLayoutProject,
	LAYOUT_PROJECT,
} from "./support/public-fixture";
import { checkPublicLayout, settlePublicPage } from "./support/public-layout";

const WIDTHS = [320, 390, 820, 1024, 1440];
const HEIGHT = 900;
const SCREENSHOT_WIDTHS = [390, 1440];
const MOBILE_MENU_BREAKPOINT = 1024;
const INTERACTIVE_VIEWPORTS = [
	{ width: 320, height: HEIGHT },
	{ width: 390, height: HEIGHT },
	{ width: 820, height: 390 },
	{ width: 1440, height: HEIGHT },
];
const messages = getMessages();
const PAGES = [
	ROUTES.about,
	ROUTES.products,
	ROUTES.services,
	ROUTES.projects,
	ROUTES.contact,
	`${ROUTES.products}/ball-guide-pillar-a-trp`,
	`${ROUTES.products}/porous-filter-tubes`,
	`${ROUTES.services}/molds`,
	`${ROUTES.services}/equipment`,
	`${ROUTES.services}/automation`,
	LAYOUT_PROJECT.path,
	`${ROUTES.search}?q=${encodeURIComponent("формы")}`,
	`${ROUTES.search}?q=${"Z".repeat(CONTENT_LIMITS.searchQuery)}`,
];
let projectID: number;

test.beforeAll(async ({ request }) => {
	projectID = await createLayoutProject(request);
});
test.afterAll(async ({ request }) => {
	if (projectID) {
		await deleteLayoutProject(request, projectID);
	}
});

for (const width of WIDTHS) {
	for (const theme of [THEMES.light, THEMES.dark]) {
		for (const size of [TEXT_SIZES.large, TEXT_SIZES.larger]) {
			test(`public pages ${width} ${theme} ${size}`, async ({
				page,
			}, testInfo) => {
				await page.setViewportSize({ width, height: HEIGHT });
				await page.goto(ROUTES.about);
				await setTheme(page, theme);
				await setTextSize(page, size);
				for (const [index, path] of PAGES.entries()) {
					await test.step(path, async () => {
						await page.goto(path);
						await settlePublicPage(page);
						await expect(
							page.getByRole("heading", { level: 1 }),
						).not.toHaveText(messages.notFound.title);
						await checkPublicLayout(page);
						if (
							SCREENSHOT_WIDTHS.includes(width) &&
							size === TEXT_SIZES.larger
						) {
							await page.screenshot({
								fullPage: true,
								animations: "disabled",
								path: testInfo.outputPath(
									`page-${index}-${theme}-${width}.png`,
								),
							});
						}
						await expect(page.getByRole("contentinfo")).toBeVisible();
					});
				}
			});
		}
	}
}

for (const viewport of INTERACTIVE_VIEWPORTS) {
	const { width } = viewport;
	for (const theme of [THEMES.light, THEMES.dark]) {
		test(`dialogs and form ${width} ${theme}`, async ({ page }, testInfo) => {
			await page.setViewportSize(viewport);
			await page.goto(LAYOUT_PROJECT.path);
			await setTheme(page, theme);
			await setTextSize(page, TEXT_SIZES.larger);
			await page.getByRole("button", { name: messages.media.open("") }).click();
			const dialog = page.getByRole("dialog");
			await expect(dialog).toBeVisible();
			await checkPublicLayout(page);
			await expect(
				dialog.getByRole("button", { name: messages.common.close }),
			).toBeInViewport();
			await dialog.screenshot({
				path: testInfo.outputPath(`gallery-${theme}-${width}.png`),
			});
			await page.keyboard.press("Escape");
			await expect(dialog).toHaveCount(0);
			await page
				.getByRole("button", {
					name: messages.navigation.openSearch,
					exact: true,
				})
				.click();
			await expect(dialog).toBeVisible();
			await checkPublicLayout(page);
			await dialog.getByRole("searchbox").fill("Пресс-формы");
			await dialog.screenshot({
				path: testInfo.outputPath(`search-${theme}-${width}.png`),
			});
			await dialog.locator('button[type="submit"]').click();
			await expect(page).toHaveURL(/\/search\?q=/);
			await settlePublicPage(page);
			await checkPublicLayout(page);
			if (width < MOBILE_MENU_BREAKPOINT) {
				await page
					.getByRole("button", {
						name: messages.navigation.openMenu,
						exact: true,
					})
					.click();
				await expect(dialog).toBeVisible();
				await checkPublicLayout(page);
				await dialog.screenshot({
					path: testInfo.outputPath(`menu-${theme}-${width}.png`),
				});
				await dialog.locator(`a[href="${ROUTES.contact}"]`).click();
				await expect(dialog).toHaveCount(0);
			}
			await page.goto(ROUTES.contact);
			const form = page.locator("main form");
			const hints = form.locator('[id$="-hint"]');
			await expect(hints).toHaveCount(3);
			for (const hint of await hints.all()) {
				await expect(hint).toBeVisible();
				const hintID = await hint.getAttribute("id");
				await expect(
					form.locator(`[aria-describedby="${hintID}"]`),
				).toHaveCount(1);
			}
			await form.locator('button[type="submit"]').click();
			await expect(form.getByRole("alert")).toHaveText(
				messages.form.validation.name,
			);
			await checkPublicLayout(page);
			await form.screenshot({
				path: testInfo.outputPath(`form-error-${theme}-${width}.png`),
			});
		});
	}
}
