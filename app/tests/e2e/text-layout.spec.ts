import type { Page } from "@playwright/test";
import { TEXT_SIZES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { expect, test } from "./support/admin";
import { setTextSize } from "./support/appearance";

const VIEWPORT_WIDTHS = [320, 820, 1440, 2560];
const VIEWPORT_HEIGHT = 1000;
const MAX_FRAME_WIDTH = 1600;
const FRAME = "#main-content > div";

async function measure(page: Page) {
	return page.locator(FRAME).evaluate((container) => {
		const frame = container.getBoundingClientRect();
		const style = getComputedStyle(container);
		return {
			width: frame.width,
			left: frame.left,
			right: document.documentElement.clientWidth - frame.right,
			padding: style.paddingInlineStart,
			rootFont: getComputedStyle(document.documentElement).fontSize,
			scrollWidth: document.documentElement.scrollWidth,
			controls: [...document.querySelectorAll("header button")].map(
				(button) => {
					const bounds = button.getBoundingClientRect();
					return { width: bounds.width, height: bounds.height };
				},
			),
		};
	});
}

async function fontSize(page: Page) {
	return page
		.getByRole("heading", { level: 1 })
		.evaluate((heading) =>
			Number.parseFloat(getComputedStyle(heading).fontSize),
		);
}

test("text size changes typography while the page frame stays fixed at every viewport", async ({
	page,
}) => {
	await page.goto(ROUTES.home);
	for (const width of VIEWPORT_WIDTHS) {
		await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
		await setTextSize(page, TEXT_SIZES.standard);
		const original = await measure(page);
		const originalFont = await fontSize(page);
		const originalLogo = await page
			.locator("header a img")
			.first()
			.boundingBox();
		let previousFont = originalFont;
		for (const size of [TEXT_SIZES.large, TEXT_SIZES.larger]) {
			await setTextSize(page, size);
			expect(await measure(page)).toEqual(original);
			const changedFont = await fontSize(page);
			expect(changedFont).toBeGreaterThan(previousFont);
			previousFont = changedFont;
			const logo = await page.locator("header a img").first().boundingBox();
			expect(logo?.width).toBe(originalLogo?.width);
			expect(logo?.height).toBe(originalLogo?.height);
		}
		expect(original.scrollWidth).toBe(width);
		expect(original.width).toBe(Math.min(width, MAX_FRAME_WIDTH));
		expect(original.left).toBeCloseTo((width - original.width) / 2);
		expect(original.right).toBeCloseTo(original.left);
		await setTextSize(page, TEXT_SIZES.standard);
		expect(await fontSize(page)).toBe(originalFont);
		expect(await measure(page)).toEqual(original);
	}
});
