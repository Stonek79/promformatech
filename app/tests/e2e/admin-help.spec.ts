import type { Page } from "@playwright/test";
import {
	adminCollectionURL,
	adminGlobalURL,
	CMS_ACTIONS,
	CMS_PATHS,
} from "../../src/config/cms";
import {
	ADMIN_BREAKPOINTS,
	COLLECTIONS,
	GLOBALS,
	ROLES,
	ROUTES,
} from "../../src/config/content";
import {
	ADMIN_HELP,
	adminHelpURL,
	HELP_TOPICS,
	type HelpTopic,
} from "../../src/config/help";
import { expect, test } from "./support/admin";
import { login } from "./support/auth";

const HELP_LINK = "Пошаговая инструкция — в новой вкладке ↗";
const UNSAVED_TITLE = "Несохранённый текст остаётся в редакторе";
const EDITOR_COLLECTIONS = [
	COLLECTIONS.pages,
	COLLECTIONS.products,
	COLLECTIONS.services,
	COLLECTIONS.projects,
	COLLECTIONS.media,
] as const;

async function assertContextHelp(page: Page, topic: HelpTopic) {
	const help = page.getByRole("complementary", {
		name: "Как работать с разделом",
	});
	await expect(help).toBeVisible();
	const link = help.getByRole("link", { name: HELP_LINK, exact: true });
	await expect(link).toHaveAttribute("href", adminHelpURL(topic));
	await expect(link).toHaveAttribute("target", "_blank");
}

for (const viewport of ADMIN_BREAKPOINTS) {
	test(`manager discovers help and follows its contents on ${viewport.name}`, async ({
		managerPage: page,
	}, testInfo) => {
		await page.setViewportSize(viewport);
		await page.goto(ROUTES.admin);
		const dashboard = page.locator("section").filter({
			has: page.getByRole("heading", {
				name: "Управление сайтом",
				exact: true,
			}),
		});
		await dashboard
			.getByRole("link", { name: ADMIN_HELP.title, exact: true })
			.click();
		await expect(page).toHaveURL(adminHelpURL());
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			ADMIN_HELP.title,
		);
		await page.screenshot({ path: testInfo.outputPath("help.png") });
		const contents = page.getByRole("navigation", { name: "Темы справочника" });
		await contents.getByRole("link", { name: /^Общие данные сайта:/ }).click();
		await expect(page).toHaveURL(adminHelpURL(HELP_TOPICS.site));
		await expect(
			page.getByRole("heading", { name: /^Общие данные сайта:/ }),
		).toBeInViewport();
		expect(
			await page.evaluate(
				() => document.documentElement.scrollWidth <= window.innerWidth,
			),
		).toBe(true);
		const openMenu = page
			.getByRole("button", { name: "Открыть Меню", exact: true })
			.filter({ visible: true })
			.first();
		if (await openMenu.isVisible()) {
			await openMenu.click();
		}
		await page
			.getByRole("link", { name: ADMIN_HELP.title, exact: true })
			.click();
		await expect(page).toHaveURL(adminHelpURL());
	});
}

test("all manager sections have contextual help; reading it preserves unsaved input", async ({
	managerPage: page,
}) => {
	for (const collection of [...EDITOR_COLLECTIONS, COLLECTIONS.leads]) {
		await page.goto(adminCollectionURL(collection));
		await assertContextHelp(page, collection);
	}
	for (const collection of EDITOR_COLLECTIONS) {
		await page.goto(adminCollectionURL(collection, CMS_ACTIONS.create));
		await assertContextHelp(page, collection);
		await expect(
			page.getByRole("link", { name: "API", exact: true }),
		).toHaveCount(0);
	}
	await page.goto(adminGlobalURL(GLOBALS.site));
	await assertContextHelp(page, HELP_TOPICS.site);
	await page.getByRole("button", { name: "Компания", exact: true }).click();
	await expect(
		page.getByRole("link", { name: "API", exact: true }),
	).toHaveCount(0);
	const name = page.getByRole("textbox", { name: /^Название компании/ });
	await name.fill(UNSAVED_TITLE);
	const popup = page.waitForEvent("popup");
	await page.getByRole("link", { name: HELP_LINK, exact: true }).click();
	const help = await popup;
	await expect(help).toHaveURL(adminHelpURL(HELP_TOPICS.site));
	await expect(
		help.getByRole("heading", { name: /^Общие данные сайта:/ }),
	).toBeInViewport();
	await help.waitForLoadState("networkidle");
	await help.close();
	await expect(name).toHaveValue(UNSAVED_TITLE);
});

test("owner settings include guidance and hide technical API tabs", async ({
	page,
}) => {
	await login(page.request, ROLES.owner);
	await page.context().setExtraHTTPHeaders({});
	await page.goto(adminCollectionURL(COLLECTIONS.users, CMS_ACTIONS.create));
	await assertContextHelp(page, HELP_TOPICS.users);
	await page.goto(adminGlobalURL(GLOBALS.service));
	await assertContextHelp(page, HELP_TOPICS.service);
	await expect(
		page.getByRole("link", { name: "API", exact: true }),
	).toHaveCount(0);
});

test("guest is redirected to login before the custom help view renders", async ({
	visitorPage: page,
}) => {
	await page.goto(adminHelpURL());
	await expect(page).toHaveURL((url) => url.pathname === CMS_PATHS.login);
	await expect(
		page.getByRole("heading", { name: ADMIN_HELP.title }),
	).toHaveCount(0);
	await expect(page.getByRole("textbox", { name: /^Email/ })).toBeVisible();
});
