import { expect, saveDraft, test } from "./support/admin";

const PRODUCT = {
	create: "/admin/collections/products/create",
	api: "/api/products",
	title: "Незавершённое изделие",
	rejectedPublicationConsoleError:
		"Failed to load resource: the server responded with a status of 400 (Bad Request)",
} as const;

test("incomplete material remains a draft and explains what is needed to publish", async ({
	managerPage: page,
	visitorPage: visitor,
	browserErrors,
}) => {
	await page.goto(PRODUCT.create);
	await page.getByRole("textbox", { name: /^Название/ }).fill(PRODUCT.title);
	await saveDraft(page, PRODUCT.api);
	await expect(page).toHaveURL(/\/admin\/collections\/products\/\d+$/);
	const id = new URL(page.url()).pathname.split("/").at(-1);
	const rejected = page.waitForResponse(
		(response) =>
			new URL(response.url()).pathname === `${PRODUCT.api}/${id}` &&
			response.request().method() === "PATCH",
	);
	await page
		.getByRole("button", { name: "Опубликовать изменения", exact: true })
		.click();
	const response = await rejected;
	await response.finished();
	expect(response.status()).toBe(400);
	await expect(
		page.getByText(
			/Для публикации добавьте краткое описание и главное изображение/,
		),
	).toBeVisible();
	// Only this deliberately rejected request may produce a browser resource error.
	await expect
		.poll(() => [...browserErrors])
		.toEqual([PRODUCT.rejectedPublicationConsoleError]);
	browserErrors.shift();
	await page.reload();
	await expect(page.getByRole("textbox", { name: /^Название/ })).toHaveValue(
		PRODUCT.title,
	);
	await page
		.getByRole("button", { name: "Дополнительно", exact: true })
		.click();
	const slug = await page
		.getByRole("textbox", { name: /^Адрес страницы/ })
		.inputValue();
	await visitor.goto(`/products/${slug}`);
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		"Страница не найдена",
	);
});
