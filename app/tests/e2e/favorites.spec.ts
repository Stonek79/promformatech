import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/config/content";
import { LOCALES } from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath } from "../../src/i18n/site-path";
import { checkPublicLayout } from "./support/public-layout";

const russian = getMessages().favorites;
const german = getMessages(LOCALES.de).favorites;
const guide = {
	slug: "ball-guide-pillar-a-trp",
	name: "Шариковая направляющая колонна A-TRP",
};
const tubes = {
	slug: "porous-filter-tubes",
	name: "Пористые фильтрующие трубки",
};

for (const width of [320, 1440]) {
	test(`favorites and comparison work at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.goto(ROUTES.products);
		for (const product of [guide, tubes]) {
			const toggle = page.getByRole("button", {
				name: russian.toggle(product.name),
				exact: true,
			});
			await toggle.click();
			await expect(toggle).toHaveAttribute("aria-pressed", "true");
		}
		await page.getByRole("link", { name: russian.title, exact: true }).click();
		await expect(page).toHaveURL(ROUTES.favorites);
		await expect(page.getByRole("heading", { name: guide.name })).toBeVisible();
		await page.reload();
		await expect(page.getByRole("heading", { name: tubes.name })).toBeVisible();
		const thumbnails = page.locator("main li img");
		await expect(thumbnails).toHaveCount(2);
		await expect(thumbnails.first()).toBeVisible();
		await expect
			.poll(() =>
				thumbnails
					.first()
					.evaluate((image) => (image as HTMLImageElement).naturalWidth),
			)
			.toBeGreaterThan(0);
		await checkPublicLayout(page);
		const selectors = page.getByRole("checkbox", { name: russian.select });
		await selectors.nth(0).check();
		await selectors.nth(1).check();
		await page
			.getByRole("link", { name: russian.compare, exact: true })
			.click();
		const table = page.getByRole("table");
		await expect(
			table.getByRole("columnheader", { name: guide.name }),
		).toBeVisible();
		await expect(
			table.getByRole("cell", { name: "Подшипниковая сталь SUJ2" }),
		).toBeVisible();
		await expect(
			table.getByRole("cell", { name: "Нержавеющая сталь 304 / 316L" }),
		).toBeVisible();
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth),
		).toBe(width);
		await page.goto(sitePath(ROUTES.favorites, LOCALES.de));
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			german.title,
		);
		await page
			.getByRole("button", { name: german.toggle(tubes.name), exact: true })
			.click();
		await expect(page.getByRole("heading", { name: tubes.name })).toHaveCount(
			0,
		);
		await page
			.getByRole("button", { name: german.toggle(guide.name), exact: true })
			.click();
		await expect(page.getByText(german.empty)).toBeVisible();
		await expect(
			page.getByRole("link", { name: german.catalog }),
		).toHaveAttribute("href", sitePath(ROUTES.products, LOCALES.de));
	});
}
