import { APPEARANCE, TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { expect, test } from "./support/admin";
import {
	checkSizeControl,
	setTextSize,
	setTheme,
	sizeButton,
	themeSwitch,
} from "./support/appearance";

const DARK_BACKGROUND = "rgb(17, 25, 35)";
const LIGHT_BACKGROUND = "rgb(255, 255, 255)";
const NARROW_VIEWPORT = { width: 320, height: 900 };
test("site appearance follows OS and preserves explicit preferences", async ({
	page,
}) => {
	await page.emulateMedia({ colorScheme: "light" });
	await page.goto(ROUTES.home);
	await expect(themeSwitch(page)).toHaveAttribute("aria-checked", "false");
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(themeSwitch(page)).toHaveAttribute("aria-checked", "true");
	await setTheme(page, THEMES.light);
	await setTheme(page, THEMES.dark);
	await setTextSize(page, TEXT_SIZES.larger);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.themeAttribute,
		THEMES.dark,
	);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.sizeAttribute,
		TEXT_SIZES.larger,
	);
	await expect(sizeButton(page)).toBeFocused();
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.themeAttribute,
		THEMES.dark,
	);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.sizeAttribute,
		TEXT_SIZES.larger,
	);
	await expect(page.locator("body")).toHaveCSS(
		"background-color",
		DARK_BACKGROUND,
	);
	await page.setViewportSize(NARROW_VIEWPORT);
	await checkSizeControl(page, TEXT_SIZES.larger);
	const search = await page
		.getByRole("button", { name: "Открыть поиск", exact: true })
		.boundingBox();
	const menu = await page
		.getByRole("button", { name: "Открыть меню", exact: true })
		.boundingBox();
	if (!search || !menu) {
		throw new Error("Mobile header controls are missing");
	}
	expect(search.y).toBe(menu.y);
	await setTheme(page, THEMES.light);
	await expect(page.locator("body")).toHaveCSS(
		"background-color",
		LIGHT_BACKGROUND,
	);
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(page.locator("body")).toHaveCSS(
		"background-color",
		LIGHT_BACKGROUND,
	);
	await setTheme(page, THEMES.light);
	await expect(page.locator("body")).toHaveCSS(
		"background-color",
		LIGHT_BACKGROUND,
	);
});

test("Next Image serves prepared responsive derivatives directly", async ({
	page,
}) => {
	await page.goto(ROUTES.home);
	const images = page.locator("main img[data-nimg]");
	await expect(images.first()).toBeVisible();
	await expect(images.first()).toHaveAttribute(
		"srcset",
		/\/media\/\d+\/small\?w=480 480w/,
	);
	expect(await images.first().getAttribute("srcset")).not.toContain(
		"/_next/image",
	);
	await expect(images.first()).toHaveJSProperty("complete", true);
	expect(
		await images
			.first()
			.evaluate((image) => (image as HTMLImageElement).naturalWidth),
	).toBeGreaterThan(0);
	const search = page.getByRole("button", {
		name: "Открыть поиск",
		exact: true,
	});
	expect(
		await search.evaluate((button) =>
			Number.parseFloat(getComputedStyle(button).borderRadius),
		),
	).toBeGreaterThan(0);
});
