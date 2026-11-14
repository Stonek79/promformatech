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

const HEIGHT = 900;
const MOBILE_MENU_BREAKPOINT = 1024;
const PAGE_LAYOUTS = [
	{ width: 320, theme: THEMES.light, size: TEXT_SIZES.larger },
	{ width: 820, theme: THEMES.light, size: TEXT_SIZES.large },
	{
		width: MOBILE_MENU_BREAKPOINT,
		theme: THEMES.dark,
		size: TEXT_SIZES.larger,
	},
	{ width: 1440, theme: THEMES.dark, size: TEXT_SIZES.larger },
] as const;
const DIALOG_LAYOUTS = [
	{ viewport: { width: 320, height: HEIGHT }, theme: THEMES.light },
	{ viewport: { width: 820, height: 390 }, theme: THEMES.dark },
	{ viewport: { width: 1440, height: HEIGHT }, theme: THEMES.light },
] as const;
const messages = getMessages();
const PAGES = [
	ROUTES.about,
	ROUTES.products,
	ROUTES.services,
	ROUTES.projects,
	ROUTES.contact,
	`${ROUTES.products}/ball-guide-pillar-a-trp`,
	`${ROUTES.services}/molds`,
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

for (const { width, theme, size } of PAGE_LAYOUTS) {
	test(`public pages ${width} ${theme} ${size}`, async ({ page }) => {
		await page.setViewportSize({ width, height: HEIGHT });
		await page.goto(ROUTES.about);
		await setTheme(page, theme);
		await setTextSize(page, size);
		for (const path of PAGES) {
			await test.step(path, async () => {
				await page.goto(path);
				await settlePublicPage(page);
				await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
					messages.notFound.title,
				);
				await checkPublicLayout(page);
				await expect(page.getByRole("contentinfo")).toBeVisible();
			});
		}
	});
}

for (const { viewport, theme } of DIALOG_LAYOUTS) {
	const { width } = viewport;
	test(`dialogs and contacts ${width} ${theme}`, async ({ page }) => {
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
			await dialog.locator(`a[href="${ROUTES.contact}"]`).click();
			await expect(dialog).toHaveCount(0);
		}
		await page.goto(ROUTES.contact);
		await expect(page.locator("main form")).toHaveCount(0);
		await expect(
			page.getByRole("link", { name: /Политика обработки/ }),
		).toHaveCount(0);
		await checkPublicLayout(page);
	});
}
