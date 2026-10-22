import { expect, publish, saveDraft, test } from "./support/admin";

const PAGE = {
	create: "/admin/collections/pages/create",
	api: "/api/pages",
	exitPreview: "/api/preview/exit",
	title: "Страница менеджера",
	heading: "Новая страница перед публикацией",
	blockHeading: "Важные сведения",
	body: "Текст, который менеджер добавил через редактор.",
	nextHeading: "Обновлённый сохранённый заголовок",
} as const;
const DEVICES = [
	{ name: "Телефон", width: 390 },
	{ name: "Планшет", width: 820 },
	{ name: "Десктоп", width: 1440 },
] as const;

test("manager adds a text block and checks saved changes in responsive live preview before publishing", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	await page.goto(PAGE.create);
	await page.getByRole("textbox", { name: /^Название/ }).fill(PAGE.title);
	await page
		.getByRole("textbox", { name: "Заголовок на сайте", exact: true })
		.fill(PAGE.heading);
	await page
		.getByRole("button", { name: "Добавить блок", exact: true })
		.click();
	await page.getByRole("button", { name: "Текст", exact: true }).click();
	await page
		.getByRole("textbox", { name: "Заголовок", exact: true })
		.fill(PAGE.blockHeading);
	await page.locator('[contenteditable="true"]').fill(PAGE.body);
	await saveDraft(page, PAGE.api);
	await expect(page).toHaveURL(/\/admin\/collections\/pages\/\d+$/);
	const id = new URL(page.url()).pathname.split("/").at(-1);
	const api = `${PAGE.api}/${id}`;
	await page.getByRole("button", { name: "Предпросмотр", exact: true }).click();
	const preview = page.frameLocator("#live-preview-iframe");
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		PAGE.heading,
	);
	await expect(
		preview.getByRole("heading", { name: PAGE.blockHeading, exact: true }),
	).toBeVisible();
	await expect(preview.getByText(PAGE.body, { exact: true })).toBeVisible();
	let currentDevice = "Responsive";
	for (const device of DEVICES) {
		await page
			.getByRole("button", { name: currentDevice, exact: true })
			.click();
		await page.getByRole("button", { name: device.name, exact: true }).click();
		await expect(page.locator("#live-preview-iframe")).toHaveJSProperty(
			"clientWidth",
			device.width,
		);
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			PAGE.heading,
		);
		currentDevice = device.name;
	}
	await page
		.getByRole("textbox", { name: "Заголовок на сайте", exact: true })
		.fill(PAGE.nextHeading);
	await saveDraft(page, api);
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		PAGE.nextHeading,
	);
	const previewURL = await page
		.locator("#live-preview-iframe")
		.getAttribute("src");
	expect(previewURL).not.toBeNull();
	const previewLink = new URL(previewURL || "", page.url());
	const response = await visitor.request.get(previewLink.toString(), {
		maxRedirects: 0,
	});
	expect(response.headers().location).toContain("/admin/login");
	await page
		.getByRole("button", {
			name: "Выйти из режима прямого просмотра",
			exact: true,
		})
		.click();
	await page.request.get(PAGE.exitPreview);
	await publish(page, api);
	await page
		.getByRole("button", { name: "Дополнительно", exact: true })
		.click();
	const slug = await page
		.getByRole("textbox", { name: /^Адрес страницы/ })
		.inputValue();
	await visitor.goto(`/${slug}`);
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		PAGE.nextHeading,
	);
	await expect(visitor.getByText(PAGE.body, { exact: true })).toBeVisible();
});
