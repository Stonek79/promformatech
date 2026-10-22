import {
	closePreview,
	expect,
	openPreview,
	publish,
	saveDraft,
	test,
} from "./support/admin";

const MATERIALS = [
	{ collection: "products", title: "Изделие менеджера" },
	{ collection: "services", title: "Услуга менеджера" },
	{ collection: "projects", title: "Проект менеджера" },
] as const;

for (const material of MATERIALS) {
	test(`manager authors, previews and publishes ${material.collection} while keeping later drafts private`, async ({
		managerPage: page,
		visitorPage: visitor,
	}) => {
		const editor = `/admin/collections/${material.collection}`;
		const api = `/api/${material.collection}`;
		await page.goto(editor);
		await page.locator(`a[href="${editor}/create"]`).first().click();
		await page.getByRole("textbox", { name: /^Название/ }).fill(material.title);
		await page
			.getByRole("textbox", { name: "Краткое описание", exact: true })
			.fill("Первое описание изделия");
		await saveDraft(page, api);
		await expect(page).toHaveURL(new RegExp(`${editor}/\\d+$`));
		const id = new URL(page.url()).pathname.split("/").at(-1);
		const endpoint = `${api}/${id}`;
		await page
			.getByRole("button", { name: "Дополнительно", exact: true })
			.click();
		const slug = await page
			.getByRole("textbox", { name: /^Адрес страницы/ })
			.inputValue();
		const path = `/${material.collection}/${slug}`;
		await visitor.goto(path);
		await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
			"Страница не найдена",
		);
		await page
			.getByRole("button", { name: "Фото и видео", exact: true })
			.click();
		await page
			.getByRole("button", { name: "Выбрать из существующих", exact: true })
			.click();
		await page
			.getByRole("button", {
				name: "Производство и команда компании",
				exact: true,
			})
			.click();
		await saveDraft(page, endpoint);
		const preview = await openPreview(page);
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			material.title,
		);
		await expect(
			preview.getByText("Первое описание изделия", { exact: true }),
		).toBeVisible();
		await closePreview(preview);
		await page.request.get("/api/preview/exit");
		await publish(page, endpoint);
		await visitor.goto(path);
		await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
			material.title,
		);
		await expect(
			visitor.getByText("Первое описание изделия", { exact: true }),
		).toBeVisible();
		await page.getByRole("button", { name: "Содержание", exact: true }).click();
		await page
			.getByRole("textbox", { name: "Краткое описание", exact: true })
			.fill("Новая правка в черновике");
		await saveDraft(page, endpoint);
		await page.reload();
		await expect(
			page.getByRole("textbox", { name: "Краткое описание", exact: true }),
		).toHaveValue("Новая правка в черновике");
		await visitor.reload();
		await expect(
			visitor.getByText("Первое описание изделия", { exact: true }),
		).toBeVisible();
		await expect(
			visitor.getByText("Новая правка в черновике", { exact: true }),
		).toHaveCount(0);
		const updatedPreview = await openPreview(page);
		await expect(
			updatedPreview.getByText("Новая правка в черновике", { exact: true }),
		).toBeVisible();
		await closePreview(updatedPreview);
		await page.request.get("/api/preview/exit");
		await publish(page, endpoint);
		await visitor.reload();
		await expect(
			visitor.getByText("Новая правка в черновике", { exact: true }),
		).toBeVisible();
	});
}
