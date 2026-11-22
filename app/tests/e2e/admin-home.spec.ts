import { LOCALES } from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath } from "../../src/i18n/site-path";
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
		await page.locator('input[name="blocks.0.heading"]').fill(HOME.heading);
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
		const localizedHome = sitePath(HOME.public, LOCALES.de);
		const { preview: messages } = getMessages(LOCALES.de);
		await preview.goto(localizedHome);
		await expect(preview.getByText(messages.status)).toBeVisible();
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			HOME.heading,
		);
		await preview.getByRole("button", { name: messages.exit }).click();
		await expect(preview).toHaveURL(localizedHome);
		await expect(preview.getByText(messages.status)).toHaveCount(0);
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			originalHeading || "",
		);
		await closePreview(preview);
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
