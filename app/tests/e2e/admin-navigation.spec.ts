import { setTimeout as delay } from "node:timers/promises";
import type { Page } from "@playwright/test";
import { adminCollectionURL } from "../../src/config/cms";
import { COLLECTIONS, ROLES, ROUTES } from "../../src/config/content";
import { expect, test } from "./support/admin";
import { login } from "./support/auth";

const PAGES_PATH = adminCollectionURL(COLLECTIONS.pages);
const PRODUCTS_PATH = adminCollectionURL(COLLECTIONS.products);
const SERVICES_PATH = adminCollectionURL(COLLECTIONS.services);
const LIST_QUERY = "?depth=1&limit=10";
const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const RSC_RESPONSE_DELAY = 500;
const COLLECTION_REQUESTS = "**/admin/collections/**";
const MENU_ACTION_TIMEOUT = 1_000;
const MENU_READY_TIMEOUT = 10_000;

test.use({ viewport: DESKTOP_VIEWPORT });

async function navigateSection(page: Page, path: string) {
	await expect(page.locator("aside.nav")).toHaveClass(/nav--nav-hydrated/);
	const openMenu = page.getByRole("button", {
		name: "Открыть Меню",
		exact: true,
	});
	const link = page.locator(`a[href="${path}"]`).first();
	// Payload applies saved navigation preferences asynchronously after hydration.
	await expect(async () => {
		if (await openMenu.isVisible()) {
			await openMenu.click({ timeout: MENU_ACTION_TIMEOUT });
		}
		await link.click({ trial: true, timeout: MENU_ACTION_TIMEOUT });
	}).toPass({ timeout: MENU_READY_TIMEOUT });
	await link.click();
}

test("manager navigates between collection lists without React console errors", async ({
	managerPage: page,
}) => {
	await page.goto(`${PAGES_PATH}${LIST_QUERY}`);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страницы");
	await navigateSection(page, PRODUCTS_PATH);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Продукция");
	await navigateSection(page, PAGES_PATH);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страницы");
	await page.goto(ROUTES.admin);
	await expect(
		page.getByRole("heading", { name: "Управление сайтом", exact: true }),
	).toBeVisible();
	await navigateSection(page, PAGES_PATH);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страницы");
	await page
		.getByRole("button", {
			name: "Сортировать по Название Восходящий",
			exact: true,
		})
		.click();
	await expect(page).toHaveURL(/sort=title/);
	await page.getByRole("button", { name: "Колонки", exact: true }).click();
	await page.getByRole("button", { name: "Колонки", exact: true }).click();
	await page.getByRole("button", { name: "Фильтры", exact: true }).click();
	await page.getByRole("button", { name: "Фильтры", exact: true }).click();
	await page
		.getByRole("textbox", { name: "Искать по", exact: true })
		.fill("Главная");
	await expect(
		page.getByRole("link", { name: "О компании", exact: true }),
	).toHaveCount(0);
	await expect(
		page.getByRole("link", { name: "Главная", exact: true }),
	).toBeVisible();
});

test("manager can replace a pending collection navigation without React console errors", async ({
	managerPage: page,
}) => {
	await page.goto(PAGES_PATH);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страницы");
	await page.route(COLLECTION_REQUESTS, async (route) => {
		if (route.request().headers().rsc) {
			await delay(RSC_RESPONSE_DELAY);
		}
		await route.continue();
	});
	try {
		await navigateSection(page, PRODUCTS_PATH);
		await navigateSection(page, SERVICES_PATH);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText("Услуги");
		await navigateSection(page, PAGES_PATH);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			"Страницы",
		);
	} finally {
		await page.unrouteAll({ behavior: "wait" });
	}
});

test("owner opens the pages list and navigates from the dashboard without React console errors", async ({
	page,
}) => {
	await login(page.request, ROLES.owner);
	await page.context().setExtraHTTPHeaders({});
	await page.goto(`${PAGES_PATH}${LIST_QUERY}`);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страницы");
	await page.goto(ROUTES.admin);
	await expect(
		page.getByRole("heading", { name: "Управление сайтом", exact: true }),
	).toBeVisible();
	await navigateSection(page, PAGES_PATH);
	await expect(page.getByRole("heading", { level: 1 })).toHaveText("Страницы");
});
