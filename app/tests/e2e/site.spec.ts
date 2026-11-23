import { expect, test } from "@playwright/test";
import { login } from "./support/auth";

test("public facade, responsive navigation and protected admin", async ({
	page,
	request,
}) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		"Прямые поставки из Китая",
	);
	await expect(
		page.getByRole("link", { name: "Контакты проекты", exact: true }),
	).toHaveCount(0);
	await expect(page.locator("main form")).toHaveCount(0);
	await expect(page.locator('a[href="/privacy"]')).toHaveCount(0);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.getByRole("button", { name: "Открыть меню" }).click();
	await expect(page.getByRole("dialog")).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(
		page.getByRole("button", { name: "Открыть меню" }),
	).toBeFocused();
	const searchTrigger = page.getByRole("button", { name: "Открыть поиск" });
	await searchTrigger.press("Enter");
	const search = page.getByRole("dialog");
	const input = search.getByRole("searchbox");
	await expect(input).toBeFocused();
	await input.fill("ПРЕСС ФОРМЫ");
	const hit = search.getByRole("link", { name: /Пресс-формы/ });
	await expect(hit).toBeVisible();
	await expect(page).toHaveURL("/");
	await input.fill("ззз несуществующий товар");
	await expect(hit).toHaveCount(0);
	await expect(search.getByRole("status")).toContainText("ничего не найдено");
	await page.keyboard.press("Escape");
	await expect(searchTrigger).toBeFocused();
	await searchTrigger.click();
	await input.fill("автоматизация");
	await search.getByRole("link", { name: /Автоматизация/ }).click();
	await expect(search).toHaveCount(0);
	await expect(page).toHaveURL("/services/automation");
	const removed = await request.get("/kontaktyi.html", { maxRedirects: 0 });
	expect(removed.headers().location).toBeUndefined();
	expect(await removed.text()).toContain("Страница не найдена");
	expect((await request.get("/api/users")).status()).toBe(403);
	expect((await request.get("/api/leads")).status()).toBe(404);
	expect((await request.get("/api/pages?draft=true")).status()).toBe(403);
	expect(
		(await request.get("/api/globals/site-settings?draft=true")).status(),
	).toBe(403);
	expect((await request.get("/sitemap.xml")).ok()).toBe(true);
});

test("manager cannot grant themselves owner permissions", async ({
	request,
}) => {
	const user = await login(request);
	await request.patch(`/api/users/${user.id}`, { data: { role: "owner" } });
	expect((await (await request.get("/api/users/me")).json()).user.role).toBe(
		"manager",
	);
	expect((await request.get("/api/globals/service-settings")).status()).toBe(
		403,
	);
	expect(
		(
			await request.post("/api/users", {
				data: {
					email: "intruder@example.test",
					password: "this-is-not-allowed",
					role: "owner",
				},
			})
		).status(),
	).toBe(403);
});
