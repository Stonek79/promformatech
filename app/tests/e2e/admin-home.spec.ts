import {
	closePreview,
	expect,
	openPreview,
	publish,
	saveDraft,
	test,
} from "./support/admin";
import { E2E_HEADERS } from "./support/config";

const HOME = {
	lookup: "/api/pages?where[slug][equals]=home&depth=0",
	api: "/api/pages",
	editor: "/admin/collections/pages",
	public: "/",
	exitPreview: "/api/preview/exit",
	heading: "Главная страница после правки менеджера",
} as const;

test("manager edits the existing home hero, previews it and publishes without exposing the draft", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const result = await (
		await page.request.get(HOME.lookup, { headers: E2E_HEADERS })
	).json();
	expect(result.totalDocs).toBe(1);
	const original = result.docs[0];
	const endpoint = `${HOME.api}/${original.id}`;
	try {
		await visitor.goto(HOME.public);
		const originalHeading = await visitor
			.getByRole("heading", { level: 1 })
			.textContent();
		await page.goto(`${HOME.editor}/${original.id}`);
		await page
			.getByRole("textbox", { name: "Заголовок", exact: true })
			.first()
			.fill(HOME.heading);
		await saveDraft(page, endpoint);
		await visitor.reload();
		await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
			originalHeading || "",
		);
		const preview = await openPreview(page);
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			HOME.heading,
		);
		await expect(
			preview.getByRole("link", {
				name: "Вернуться к редактированию",
				exact: true,
			}),
		).toHaveAttribute("href", `${HOME.editor}/${original.id}`);
		await closePreview(preview);
		await page.request.get(HOME.exitPreview);
		await publish(page, endpoint);
		await visitor.reload();
		await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
			HOME.heading,
		);
		await page.getByRole("link", { name: /^Версии/ }).click();
		await expect(page.getByRole("table")).toBeVisible();
	} finally {
		expect(
			(
				await page.request.patch(endpoint, {
					headers: E2E_HEADERS,
					data: { blocks: original.blocks, _status: "published" },
				})
			).ok(),
		).toBe(true);
	}
});
