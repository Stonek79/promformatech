import { expect, test } from "@playwright/test";
import { TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { getMessages } from "../../src/i18n/messages";
import { setTextSize, setTheme } from "./support/appearance";
import { checkPublicLayout, settlePublicPage } from "./support/public-layout";

const MISSING_PAGE = "/missing-layout-test-page";
const NOT_FOUND_STATUS = 404;
const STREAMED_STATUS = 200;
const SERVER_ERROR_STATUS = 500;
const HEIGHT = 900;
const MISSING_PATHS = [MISSING_PAGE, ROUTES.privacy];
const messages = getMessages().notFound;

for (const width of [320, 1440]) {
	for (const theme of [THEMES.light, THEMES.dark]) {
		test(`missing page ${width} ${theme}`, async ({ page }, testInfo) => {
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
				expect([STREAMED_STATUS, NOT_FOUND_STATUS]).toContain(
					response?.status(),
				);
				await settlePublicPage(page);
				await expect(page.getByRole("heading", { level: 1 })).toHaveText(
					messages.title,
				);
				await expect(
					page.locator('meta[name="robots"]').first(),
				).toHaveAttribute("content", /noindex/);
				await checkPublicLayout(page);
			}
			await page.screenshot({
				fullPage: true,
				path: testInfo.outputPath(`404-${theme}-${width}.png`),
			});
			await page.locator(`main a[href="${ROUTES.home}"]`).click();
			await expect(page).toHaveURL(ROUTES.home);
			expect(errors).toEqual([]);
		});
	}
}
