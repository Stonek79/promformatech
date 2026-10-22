import { randomUUID } from "node:crypto";
import { expect, test } from "./support/admin";
import { E2E_HEADERS } from "./support/config";
import { runWorker } from "./support/jobs";

const ADMIN_PATHS = {
	login: "/admin/login",
	account: "/admin/account",
	leads: "/admin/collections/leads",
	leadsAPI: "/api/leads",
	inquiries: "/api/inquiries",
} as const;
const SECTIONS = [
	{ path: "/admin/collections/pages", title: "Страницы" },
	{ path: "/admin/collections/products", title: "Продукция" },
	{ path: "/admin/collections/services", title: "Услуги" },
	{ path: "/admin/collections/projects", title: "Реализованные проекты" },
	{ path: "/admin/collections/media", title: "Фото и видео" },
	{ path: ADMIN_PATHS.leads, title: "Заявки" },
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

test("manager saves lead status and notes while the original message stays read-only", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const inquiry = {
		requestID: randomUUID(),
		name: "Клиент для менеджера",
		contact: "manager-workflow@example.test",
		message: "Исходное обращение клиента",
		sourcePath: "/contacts",
		consent: true,
	};
	expect(
		(
			await visitor.request.post(ADMIN_PATHS.inquiries, {
				headers: E2E_HEADERS,
				data: inquiry,
			})
		).status(),
	).toBe(201);
	const result = await (
		await page.request.get(
			`${ADMIN_PATHS.leadsAPI}?where[requestID][equals]=${inquiry.requestID}`,
			{ headers: E2E_HEADERS },
		)
	).json();
	expect(result.totalDocs).toBe(1);
	const id = result.docs[0].id;
	const endpoint = `${ADMIN_PATHS.leadsAPI}/${id}`;
	runWorker();
	await page.goto(ADMIN_PATHS.leads);
	await page.getByRole("link", { name: inquiry.name, exact: true }).click();
	await expect(page.getByRole("textbox", { name: /^Имя/ })).not.toBeEditable();
	await expect(
		page.getByRole("textbox", { name: "Сообщение", exact: true }),
	).not.toBeEditable();
	await page.getByRole("combobox").click();
	await page.getByRole("option", { name: "В работе", exact: true }).click();
	await page
		.getByRole("textbox", { name: "Комментарий менеджера", exact: true })
		.fill("Связались, готовим предложение");
	const saved = page.waitForResponse(
		(response) =>
			new URL(response.url()).pathname === endpoint &&
			response.request().method() === "PATCH",
	);
	await page.getByRole("button", { name: "Сохранить", exact: true }).click();
	expect((await saved).ok()).toBe(true);
	await page.reload();
	await expect(
		page.getByRole("textbox", { name: "Комментарий менеджера", exact: true }),
	).toHaveValue("Связались, готовим предложение");
	await expect(page.getByText("В работе", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("textbox", { name: "Сообщение", exact: true }),
	).toHaveValue(inquiry.message);
	const queued = page.waitForResponse(
		(response) =>
			new URL(response.url()).pathname === `${endpoint}/notify` &&
			response.request().method() === "POST",
	);
	await page
		.getByRole("button", { name: "Повторить уведомление", exact: true })
		.click();
	expect((await queued).ok()).toBe(true);
	runWorker();
	await expect(
		page.getByRole("button", { name: "Повторить уведомление", exact: true }),
	).toBeVisible();
});
