import { expect, test } from "./support/admin";

const ADMIN_PATHS = {
	login: "/admin/login",
	account: "/admin/account",
} as const;
const SECTIONS = [
	{ path: "/admin/collections/pages", title: "Страницы" },
	{ path: "/admin/collections/products", title: "Продукция" },
	{ path: "/admin/collections/services", title: "Услуги" },
	{ path: "/admin/collections/projects", title: "Реализованные проекты" },
	{ path: "/admin/collections/media", title: "Фото и видео" },
] as const;

test("manager signs in through the form and opens every allowed section without runtime errors", async ({
	page,
}) => {
	await page.goto(ADMIN_PATHS.login);
	await page
		.getByRole("textbox", { name: /^Email/ })
		.fill("manager@example.test");
	await page.getByLabel(/^Пароль/).fill(process.env.TEST_PASSWORD || "");
	await page.getByRole("button", { name: "Войти", exact: true }).click();
	await expect(
		page.getByRole("heading", { name: "Управление сайтом", exact: true }),
	).toBeVisible();
	for (const section of SECTIONS) {
		await page.goto(section.path);
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			section.title,
		);
	}
	await expect(
		page.getByRole("link", { name: "Пользователи", exact: true }),
	).toHaveCount(0);
	await expect(
		page.getByRole("link", { name: "Служебные настройки", exact: true }),
	).toHaveCount(0);
	await page.goto(ADMIN_PATHS.account);
	await expect(page.getByRole("textbox", { name: /^Имя/ })).toBeVisible();
	await expect(page.getByRole("combobox", { name: /^Роль/ })).toHaveCount(0);
});
