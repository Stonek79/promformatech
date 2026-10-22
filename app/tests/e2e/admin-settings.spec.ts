import {
	closePreview,
	expect,
	openPreview,
	publish,
	saveDraft,
	test,
} from "./support/admin";
import { E2E_HEADERS } from "./support/config";

const SETTINGS = {
	editor: "/admin/globals/site-settings",
	api: "/api/globals/site-settings",
	home: "/",
	exitPreview: "/api/preview/exit",
	phone: "+7 900 111-22-33",
	company: "Компания менеджера",
	copyright: "Проверено редактором сайта",
	formTitle: "Напишите менеджеру",
} as const;

test("manager edits every settings tab, previews a private draft and publishes explicitly", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const original = await (await page.request.get(SETTINGS.api)).json();
	try {
		await visitor.goto(SETTINGS.home);
		await expect(
			visitor
				.getByRole("banner")
				.getByRole("link", { name: original.phone, exact: true }),
		).toBeVisible();
		await page.goto(SETTINGS.editor);
		await page
			.getByRole("textbox", { name: /^Название компании/ })
			.fill(SETTINGS.company);
		await page.getByRole("button", { name: "Контакты", exact: true }).click();
		await page
			.getByRole("textbox", { name: "Основной телефон", exact: true })
			.fill(SETTINGS.phone);
		await page
			.getByRole("button", { name: "Меню и подвал", exact: true })
			.click();
		await page
			.getByRole("textbox", { name: "Подпись авторских прав", exact: true })
			.fill(SETTINGS.copyright);
		await page
			.getByRole("button", { name: "Форма связи", exact: true })
			.click();
		await page
			.getByRole("textbox", { name: "Заголовок", exact: true })
			.fill(SETTINGS.formTitle);
		await page
			.getByRole("button", { name: "Подписи и SEO", exact: true })
			.click();
		await page
			.getByRole("textbox", { name: "Заголовок в поиске", exact: true })
			.fill("Настройки SEO менеджера");
		await saveDraft(page, SETTINGS.api);
		await page.reload();
		await page.getByRole("button", { name: "Контакты", exact: true }).click();
		await expect(
			page.getByRole("textbox", { name: "Основной телефон", exact: true }),
		).toHaveValue(SETTINGS.phone);
		await visitor.reload();
		await expect(
			visitor
				.getByRole("banner")
				.getByRole("link", { name: original.phone, exact: true }),
		).toBeVisible();
		await expect(
			visitor.getByText(SETTINGS.copyright, { exact: true }),
		).toHaveCount(0);
		const preview = await openPreview(page);
		await expect(
			preview
				.getByRole("banner")
				.getByRole("link", { name: SETTINGS.phone, exact: true }),
		).toBeVisible();
		await expect(
			preview.getByText(SETTINGS.copyright, { exact: true }),
		).toBeVisible();
		await expect(
			preview.getByRole("heading", { name: SETTINGS.formTitle, exact: true }),
		).toBeVisible();
		await expect(
			preview.getByRole("button", {
				name: original.form.submitLabel,
				exact: true,
			}),
		).toBeDisabled();
		await closePreview(preview);
		await page.request.get(SETTINGS.exitPreview);
		await publish(page, SETTINGS.api);
		await visitor.reload();
		await expect(
			visitor
				.getByRole("banner")
				.getByRole("link", { name: SETTINGS.phone, exact: true }),
		).toBeVisible();
		await expect(
			visitor.getByText(SETTINGS.copyright, { exact: true }),
		).toBeVisible();
		await expect(
			visitor.getByRole("heading", { name: SETTINGS.formTitle, exact: true }),
		).toBeVisible();
	} finally {
		const restored = await page.request.post(SETTINGS.api, {
			headers: E2E_HEADERS,
			data: {
				companyName: original.companyName,
				phone: original.phone,
				copyright: original.copyright,
				form: original.form,
				seo: original.seo,
				_status: "published",
			},
		});
		expect(restored.ok()).toBe(true);
	}
});
