import { APPEARANCE, TEXT_SIZES, THEMES } from "../../src/config/appearance";
import {
	adminCollectionURL,
	adminGlobalURL,
	CMS_ACTIONS,
} from "../../src/config/cms";
import {
	ADMIN_BREAKPOINTS,
	COLLECTIONS,
	GLOBALS,
	ROLES,
} from "../../src/config/content";
import { expect, test } from "./support/admin";
import { checkSizeControl, setTextSize, setTheme } from "./support/appearance";
import { login } from "./support/auth";

const UNSAVED_NAME = "Название ещё не сохранено";

test("manager changes native theme and text size without losing input", async ({
	managerPage: page,
}, testInfo) => {
	await page.emulateMedia({ colorScheme: "light" });
	await page.goto(adminGlobalURL(GLOBALS.site));
	await page.getByRole("button", { name: "Компания", exact: true }).click();
	const name = page.getByRole("textbox", { name: /^Название компании/ });
	const previousName = await name.inputValue();
	await name.fill(UNSAVED_NAME);
	const initialField = await name.evaluate((input) => ({
		width: input.getBoundingClientRect().width,
		font: Number.parseFloat(getComputedStyle(input).fontSize),
		rootFont: getComputedStyle(document.documentElement).fontSize,
	}));
	await setTheme(page, THEMES.dark);
	await setTextSize(page, TEXT_SIZES.larger);
	const enlargedField = await name.evaluate((input) => ({
		width: input.getBoundingClientRect().width,
		font: Number.parseFloat(getComputedStyle(input).fontSize),
		rootFont: getComputedStyle(document.documentElement).fontSize,
	}));
	expect(enlargedField.width).toBe(initialField.width);
	expect(enlargedField.rootFont).toBe(initialField.rootFont);
	expect(enlargedField.font).toBeGreaterThan(initialField.font);
	await expect(page.locator("html")).toHaveAttribute("data-theme", THEMES.dark);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.sizeAttribute,
		TEXT_SIZES.larger,
	);
	await expect(name).toHaveValue(UNSAVED_NAME);
	await name.fill(previousName);
	await page.reload();
	await expect(page.locator("html")).toHaveAttribute("data-theme", THEMES.dark);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.sizeAttribute,
		TEXT_SIZES.larger,
	);
	for (const viewport of ADMIN_BREAKPOINTS) {
		await page.setViewportSize(viewport);
		await checkSizeControl(page, TEXT_SIZES.larger);
		await page.screenshot({
			animations: "disabled",
			path: testInfo.outputPath(`admin-dark-${viewport.width}.png`),
		});
		expect(
			await page.evaluate(() => ({
				width: innerWidth,
				scrollWidth: document.documentElement.scrollWidth,
			})),
		).toEqual({ width: viewport.width, scrollWidth: viewport.width });
	}
	await setTheme(page, THEMES.light);
	await expect(page.locator("html")).toHaveAttribute(
		"data-theme",
		THEMES.light,
	);
	await page.emulateMedia({ colorScheme: "dark" });
	await expect(page.locator("html")).toHaveAttribute(
		"data-theme",
		THEMES.light,
	);
	await setTheme(page, THEMES.light);
	await expect(page.locator("html")).toHaveAttribute(
		"data-theme",
		THEMES.light,
	);
	await page.screenshot({
		animations: "disabled",
		path: testInfo.outputPath("admin-light.png"),
	});
});

test("array actions use Russian labels for managers and owners", async ({
	managerPage: page,
}) => {
	await page.goto(adminGlobalURL(GLOBALS.site));
	await page.getByRole("button", { name: "Контакты", exact: true }).click();
	await expect(
		page.getByRole("button", {
			name: "Добавить офис или производство",
			exact: true,
		}),
	).toBeVisible();
	await expect(
		page
			.getByRole("button", { name: "Добавить контактное лицо", exact: true })
			.first(),
	).toBeVisible();
	await page
		.getByRole("button", { name: "Меню и подвал", exact: true })
		.click();
	await expect(
		page.getByRole("button", { name: "Добавить пункт меню", exact: true }),
	).toBeVisible();
	await expect(
		page.getByRole("button", { name: "Добавить ссылку", exact: true }),
	).toBeVisible();
	await page.goto(adminCollectionURL(COLLECTIONS.products, CMS_ACTIONS.create));
	await expect(
		page.getByRole("button", { name: "Добавить характеристику", exact: true }),
	).toBeVisible();
	await login(page.request, ROLES.owner);
	await page.goto(adminGlobalURL(GLOBALS.service));
	await expect(
		page.getByRole("button", { name: "Добавить получателя", exact: true }),
	).toBeVisible();
	await expect(page.getByRole("button", { name: /Recipient/ })).toHaveCount(0);
});
