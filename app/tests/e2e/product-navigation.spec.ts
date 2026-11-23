import { expect, test } from "@playwright/test";
import { TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { setTextSize, setTheme } from "./support/appearance";
import { checkPublicLayout, settlePublicPage } from "./support/public-layout";

test("A-TRP fits its photo and specifications side by side on wide screens", async ({
	page,
}) => {
	const path = `${ROUTES.products}/ball-guide-pillar-a-trp`;
	const viewports = [
		{ width: 1105, height: 629 },
		{ width: 2560, height: 900 },
	];
	const maxColumnGap = 48;
	await page.setViewportSize(viewports[0]);
	await page.goto(ROUTES.products);
	await setTheme(page, THEMES.dark);
	await setTextSize(page, TEXT_SIZES.larger);
	await page.locator(`main a[href="${path}"]`).click();
	await expect(page).toHaveURL(path);
	await settlePublicPage(page);
	const frame = page.getByRole("button", { name: /^Открыть:/ }).first();
	const photo = frame.locator("img");
	const specifications = page.getByRole("heading", { name: "Характеристики" });
	await expect(photo).toHaveJSProperty("complete", true);
	await expect(photo).toHaveCSS("object-fit", "cover");
	await expect(page.getByText("Подшипниковая сталь SUJ2")).toBeVisible();
	for (const viewport of viewports) {
		await page.setViewportSize(viewport);
		const [cover, image, specs] = await Promise.all([
			frame.boundingBox(),
			photo.boundingBox(),
			specifications.boundingBox(),
		]);
		if (!cover || !image || !specs) {
			throw new Error("The product photo or specifications are missing");
		}
		expect(image.width).toBeCloseTo(cover.width, 0);
		expect(image.height).toBeCloseTo(cover.height, 0);
		expect(specs.y).toBeCloseTo(cover.y, 0);
		const gap = specs.x - (cover.x + cover.width);
		expect(gap).toBeGreaterThan(0);
		expect(gap).toBeLessThanOrEqual(maxColumnGap);
		expect(cover.y + cover.height).toBeLessThanOrEqual(viewport.height);
		await checkPublicLayout(page);
	}
});

test("mobile catalogue restores the selected card and opens an enlargeable photo", async ({
	page,
}) => {
	const height = 540;
	await page.setViewportSize({ width: 390, height });
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(ROUTES.products);
	const header = page.locator("body > header");
	const toTop = page.getByRole("button", { name: "Наверх" });
	const product = `${ROUTES.products}/porous-filter-tubes`;
	const card = page.locator(`main a[href="${product}"]`);
	await expect(card).toBeVisible();
	await expect(page.getByRole("contentinfo")).toBeVisible();
	await page.evaluate(() =>
		window.scrollTo(0, document.documentElement.scrollHeight),
	);
	await expect
		.poll(() => page.evaluate(() => window.scrollY))
		.toBeGreaterThanOrEqual(height);
	expect((await header.boundingBox())?.y).toBeCloseTo(0, 0);
	await expect(toTop).toHaveAttribute("data-active", "true");
	await expect(toTop).toHaveAttribute("data-active", "false");
	await toTop.focus();
	await toTop.click();
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

	await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
	const cardTop = await card.evaluate(
		(element) => element.getBoundingClientRect().top,
	);
	const scrollTop = await page.evaluate(() => window.scrollY);
	expect(scrollTop).toBeGreaterThan(0);
	await card.click();
	await expect(page).toHaveURL(product);
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	const photo = page.getByRole("button", { name: /^Открыть:/ }).first();
	await expect(photo).toBeVisible();
	const image = photo.locator("img");
	await expect(image).toHaveJSProperty("complete", true);
	expect(
		await image.evaluate((element) =>
			element instanceof HTMLImageElement ? element.naturalWidth : 0,
		),
	).toBeGreaterThan(0);
	await expect(image).toHaveCSS("object-fit", "cover");
	const frame = await photo.boundingBox();
	const thumbnail = await image.boundingBox();
	if (!frame || !thumbnail) {
		throw new Error("The product photo frame or thumbnail is missing");
	}
	expect(frame.width / frame.height).toBeCloseTo(4 / 3, 2);
	expect(thumbnail.width).toBeCloseTo(frame.width, 0);
	expect(thumbnail.height).toBeCloseTo(frame.height, 0);
	await photo.press("Enter");
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await expect(dialog.locator("img")).toHaveCSS("object-fit", "contain");
	await dialog.getByRole("button", { name: "Увеличить фото" }).click();
	await expect(dialog.getByRole("region")).toHaveAttribute(
		"data-zoomed",
		"true",
	);
	await page.keyboard.press("Escape");
	await expect(dialog).toBeHidden();
	await expect(photo).toBeFocused();
	await page.getByRole("link", { name: "Назад", exact: true }).click();
	await expect(page).toHaveURL(new RegExp(`${ROUTES.products}$`));
	await expect(card).toBeFocused();
	await expect
		.poll(async () => (await card.boundingBox())?.y)
		.toBeCloseTo(cardTop, 0);
});
