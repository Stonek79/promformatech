import { APPEARANCE, TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { expect, test } from "./support/admin";
import { setTheme, sizeButton, themeSwitch } from "./support/appearance";

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 900 };
const MAX_SCRIM_OPACITY = 0.5;

test("hero keeps the photo behind the whole banner in both themes and on mobile", async ({
	page,
}, testInfo) => {
	await page.goto(ROUTES.home);
	const hero = page
		.locator("main section")
		.filter({ has: page.getByRole("heading", { level: 1 }) })
		.first();
	const image = hero.locator("img");
	await expect(image).toHaveJSProperty("complete", true);
	await expect(image).not.toHaveJSProperty("naturalWidth", 0);
	for (const viewport of [DESKTOP, MOBILE]) {
		await page.setViewportSize(viewport);
		const scrims: string[] = [];
		for (const theme of [THEMES.light, THEMES.dark]) {
			await setTheme(page, theme);
			const bannerBounds = await hero.boundingBox();
			const imageBounds = await image.boundingBox();
			const headingBounds = await page
				.getByRole("heading", { level: 1 })
				.boundingBox();
			if (!bannerBounds || !imageBounds || !headingBounds) {
				throw new Error("Hero image or heading is missing");
			}
			expect(imageBounds).toEqual(bannerBounds);
			expect(headingBounds.y).toBeGreaterThanOrEqual(imageBounds.y);
			expect(headingBounds.y + headingBounds.height).toBeLessThanOrEqual(
				imageBounds.y + imageBounds.height,
			);
			const overlay = await image.evaluate((photo) => {
				const scrim = photo.parentElement?.nextElementSibling;
				if (!scrim) {
					throw new Error("Hero overlay is missing");
				}
				const style = getComputedStyle(scrim);
				return {
					background: style.backgroundImage,
					color: style.backgroundColor,
				};
			});
			expect(overlay.background).toBe("none");
			const alpha = Number(
				overlay.color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1],
			);
			expect(alpha).toBeGreaterThan(0);
			expect(alpha).toBeLessThan(MAX_SCRIM_OPACITY);
			scrims.push(overlay.color);
			await page.screenshot({
				animations: "disabled",
				path: testInfo.outputPath(`hero-${theme}-${viewport.width}.png`),
			});
		}
		expect(scrims[0]).not.toBe(scrims[1]);
	}
});

test("appearance switches directly with the keyboard and cycles all text sizes", async ({
	page,
}) => {
	await page.goto(ROUTES.home);
	await setTheme(page, THEMES.light);
	await themeSwitch(page).focus();
	await page.keyboard.press("Space");
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.themeAttribute,
		THEMES.dark,
	);
	await expect(themeSwitch(page)).toBeFocused();
	await page.keyboard.press("Enter");
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.themeAttribute,
		THEMES.light,
	);
	await sizeButton(page).focus();
	for (const size of [
		TEXT_SIZES.large,
		TEXT_SIZES.larger,
		TEXT_SIZES.standard,
	]) {
		await page.keyboard.press("Enter");
		await expect(page.locator("html")).toHaveAttribute(
			APPEARANCE.sizeAttribute,
			size,
		);
		await expect(sizeButton(page)).toBeFocused();
		await expect(page.getByRole("dialog")).toHaveCount(0);
		await expect(page.getByRole("menu")).toHaveCount(0);
	}
});
