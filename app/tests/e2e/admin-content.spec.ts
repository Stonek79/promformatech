import { adminCollectionURL, CMS_ACTIONS } from "../../src/config/cms";
import { COLLECTIONS, ROUTES } from "../../src/config/content";
import {
	closePreview,
	expect,
	openPreview,
	publish,
	saveDraft,
	test,
} from "./support/admin";

const PROJECT_TITLE = "Проект менеджера";

test("manager creates, previews and publishes a project with private drafts", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const editor = adminCollectionURL(COLLECTIONS.projects);
	const api = `${ROUTES.api}/${COLLECTIONS.projects}`;
	await page.goto(adminCollectionURL(COLLECTIONS.projects, CMS_ACTIONS.create));
	await page.getByRole("textbox", { name: /^Название/ }).fill(PROJECT_TITLE);
	await page
		.locator('textarea[name="summary"]')
		.fill("Первое описание проекта");
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
	const path = `${ROUTES.projects}/${slug}`;
	await visitor.goto(path);
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		"Страница не найдена",
	);
	await page.getByRole("button", { name: "Фото и видео", exact: true }).click();
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
		PROJECT_TITLE,
	);
	await expect(
		preview.getByText("Первое описание проекта", { exact: true }),
	).toBeVisible();
	await closePreview(preview);
	await page.request.get("/api/preview/exit");
	await publish(page, endpoint);
	await visitor.goto(path);
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		PROJECT_TITLE,
	);
	await expect(
		visitor.getByText("Первое описание проекта", { exact: true }),
	).toBeVisible();
	await page.getByRole("button", { name: "Содержание", exact: true }).click();
	await page
		.locator('textarea[name="summary"]')
		.fill("Новая правка в черновике");
	await saveDraft(page, endpoint);
	await page.reload();
	await expect(page.locator('textarea[name="summary"]')).toHaveValue(
		"Новая правка в черновике",
	);
	await visitor.reload();
	await expect(
		visitor.getByText("Первое описание проекта", { exact: true }),
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
