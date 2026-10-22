import { test as base, expect, type Page } from "@playwright/test";
import { login } from "./auth";
import {
	attachBrowserErrors,
	type BrowserDiagnostics,
	observeBrowserErrors,
} from "./browser-errors";

export const ADMIN = {
	root: "/admin",
	saveDraft: "Сохранить черновик",
	preview: "Предпросмотр",
} as const;

export async function saveDraft(page: Page, endpoint: string) {
	const response = page.waitForResponse(
		(result) =>
			new URL(result.url()).pathname === endpoint &&
			["POST", "PATCH"].includes(result.request().method()),
	);
	await page
		.getByRole("button", { name: ADMIN.saveDraft, exact: true })
		.click();
	const result = await response;
	await result.finished();
	expect(result.ok()).toBe(true);
}

export async function publish(page: Page, endpoint: string) {
	const response = page.waitForResponse(
		(result) =>
			new URL(result.url()).pathname === endpoint &&
			["POST", "PATCH"].includes(result.request().method()),
	);
	await page
		.getByRole("button", { name: /^(Публиковать|Опубликовать изменения)$/ })
		.click();
	const result = await response;
	await result.finished();
	expect(result.ok()).toBe(true);
}

export async function openPreview(page: Page) {
	const popup = page.waitForEvent("popup");
	await page.getByRole("link", { name: ADMIN.preview, exact: true }).click();
	const preview = await popup;
	await preview.waitForLoadState("load");
	await expect(
		preview.getByText("Предпросмотр — изменения ещё не опубликованы"),
	).toBeVisible();
	return preview;
}

export async function closePreview(preview: Page) {
	// Let Payload's initial refresh finish before closing the receiving window.
	await preview.waitForLoadState("networkidle");
	await preview.close();
}

export const test = base.extend<{
	managerPage: Page;
	visitorPage: Page;
	browserErrors: string[];
	browserDiagnostics: BrowserDiagnostics;
}>({
	browserDiagnostics: [
		async ({ context }, use, testInfo) => {
			const diagnostics: BrowserDiagnostics = { errors: [], consoleErrors: [] };
			context.on("page", (page) => {
				observeBrowserErrors(page, diagnostics);
			});
			await use(diagnostics);
			await attachBrowserErrors(diagnostics, testInfo);
			expect(
				diagnostics.errors,
				"Browser exceptions, console errors and server errors",
			).toEqual([]);
		},
		{ auto: true },
	],
	browserErrors: async ({ browserDiagnostics }, use) => {
		await use(browserDiagnostics.errors);
	},
	managerPage: async ({ page }, use, testInfo) => {
		await login(page.request);
		await page.context().setExtraHTTPHeaders({});
		await use(page);
		if (!page.isClosed() && testInfo.status !== testInfo.expectedStatus) {
			await testInfo.attach("manager-page", {
				body: await page.locator("body").ariaSnapshot(),
				contentType: "text/plain",
			});
		}
	},
	visitorPage: async ({ browser, baseURL, browserDiagnostics }, use) => {
		const context = await browser.newContext({ baseURL });
		const page = await context.newPage();
		observeBrowserErrors(page, browserDiagnostics);
		await use(page);
		await context.close();
	},
});

export { expect };
