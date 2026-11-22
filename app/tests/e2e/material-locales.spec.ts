import type { Page } from "@playwright/test";
import { adminCollectionURL, collectionAPIURL } from "../../src/config/cms";
import {
	COLLECTIONS,
	ROUTES,
	type ShowcaseCollection,
} from "../../src/config/content";
import {
	LOCALES,
	type Locale,
	SITE_LANGUAGE_QUERY,
} from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath } from "../../src/i18n/site-path";
import { materialPath } from "../../src/lib/urls";
import {
	closePreview,
	expect,
	publish,
	saveDraft,
	test,
} from "./support/admin";
import { E2E_HEADERS } from "./support/config";
import {
	createLayoutProject,
	deleteLayoutProject,
	LAYOUT_PROJECT,
} from "./support/public-fixture";

const PRODUCT = {
	collection: COLLECTIONS.products,
	slug: "ball-guide-pillar-a-trp",
	en: "A-TRP precision guide pillar",
	specification: "Bearing material",
	sourceValue: "Подшипниковая сталь SUJ2",
} as const;
const SERVICE = {
	collection: COLLECTIONS.services,
	slug: "molds",
	sourceTitle: "Пресс-формы",
	sourceSummary:
		"Разработка и изготовление пресс-форм под задачи вашего производства.",
	enSummary: "Custom production tooling engineering",
	de: "Werkzeugbau für die Industrie",
	deBlock: "Lösungen für Ihre Produktion",
} as const;
const PROJECT = {
	collection: COLLECTIONS.projects,
	slug: LAYOUT_PROJECT.slug,
	en: "Automated project for precision tooling",
	enCaption: "Tooling line after setup",
	deTask: "Werkzeuge für die Serienproduktion entwickeln.",
	sourceTask:
		"Спроектировать и изготовить оснастку для серийного выпуска деталей.",
} as const;

type Target = {
	readonly collection: ShowcaseCollection;
	readonly slug: string;
};
type Editor = Target & { readonly id: number };

async function openEditor(page: Page, target: Target): Promise<Editor> {
	const query = new URLSearchParams({
		"where[slug][equals]": target.slug,
		depth: "0",
	});
	const response = await page.request.get(
		`${collectionAPIURL(target.collection)}?${query}`,
		{ headers: E2E_HEADERS },
	);
	expect(response.ok()).toBe(true);
	const result = await response.json();
	expect(result.totalDocs).toBe(1);
	return { ...target, id: result.docs[0].id };
}

const editorPath = (editor: Editor, locale: Locale) =>
	`${adminCollectionURL(editor.collection, editor.id)}?${SITE_LANGUAGE_QUERY}=${locale}`;
const publicPath = (target: Target, locale: Locale) =>
	sitePath(materialPath(target.collection, target.slug), locale);
const endpoint = ({ collection, id }: Editor) =>
	collectionAPIURL(collection, id);

async function openPreview(page: Page, editor: Editor, locale: Locale) {
	const opening = page.waitForEvent("popup");
	await page.getByRole("link", { name: "Предпросмотр", exact: true }).click();
	const preview = await opening;
	await expect(preview).toHaveURL(publicPath(editor, locale));
	const messages = getMessages(locale).preview;
	await expect(preview.getByText(messages.status)).toBeVisible();
	await expect(
		preview.getByRole("link", { name: messages.back }),
	).toHaveAttribute("href", editorPath(editor, locale));
	return preview;
}

test("product draft translates the name and specification while keeping a Russian value", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const editor = await openEditor(page, PRODUCT);
	await page.goto(editorPath(editor, LOCALES.en));
	await page.locator('input[name="title"]').fill(PRODUCT.en);
	await page
		.locator('input[name="specifications.0.label"]')
		.fill(PRODUCT.specification);
	await saveDraft(page, endpoint(editor));
	const preview = await openPreview(page, editor, LOCALES.en);
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		PRODUCT.en,
	);
	await expect(
		preview.getByText(PRODUCT.specification, { exact: true }),
	).toHaveAttribute("lang", LOCALES.en);
	await expect(
		preview.getByText(PRODUCT.sourceValue, { exact: true }),
	).toHaveAttribute("lang", LOCALES.ru);
	await closePreview(preview);

	await visitor.goto(publicPath(PRODUCT, LOCALES.en));
	await expect(visitor.getByText(PRODUCT.en)).toHaveCount(0);
	await expect(
		visitor.getByText(PRODUCT.sourceValue, { exact: true }),
	).toBeVisible();
	await visitor.goto(sitePath(ROUTES.products, LOCALES.en));
	await expect(visitor.getByText(PRODUCT.en)).toHaveCount(0);
	await expect(
		visitor.locator(`main a[href="${publicPath(PRODUCT, LOCALES.en)}"] h2`),
	).toHaveAttribute("lang", LOCALES.ru);
});

test("service translations remain private and can publish with the Russian summary", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const editor = await openEditor(page, SERVICE);
	await page.goto(editorPath(editor, LOCALES.en));
	await page.locator('textarea[name="summary"]').fill(SERVICE.enSummary);
	await saveDraft(page, endpoint(editor));

	await page.goto(editorPath(editor, LOCALES.de));
	await page.locator('input[name="title"]').fill(SERVICE.de);
	await page.locator('input[name="blocks.0.heading"]').fill(SERVICE.deBlock);
	await expect(page.locator('textarea[name="summary"]')).toHaveValue("");
	await saveDraft(page, endpoint(editor));

	const preview = await openPreview(page, editor, LOCALES.de);
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		SERVICE.de,
	);
	await expect(
		preview.getByText(SERVICE.sourceSummary, { exact: true }),
	).toHaveAttribute("lang", LOCALES.ru);
	await expect(
		preview.getByRole("heading", { name: SERVICE.deBlock }),
	).toHaveAttribute("lang", LOCALES.de);
	await preview.goto(publicPath(SERVICE, LOCALES.en));
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		SERVICE.sourceTitle,
	);
	await expect(
		preview.getByText(SERVICE.enSummary, { exact: true }),
	).toHaveAttribute("lang", LOCALES.en);
	await closePreview(preview);

	await visitor.goto(publicPath(SERVICE, LOCALES.de));
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		SERVICE.sourceTitle,
	);
	await visitor.goto(sitePath(ROUTES.home, LOCALES.de));
	const related = visitor.locator(
		`main a[href="${publicPath(SERVICE, LOCALES.de)}"] h3`,
	);
	await expect(related).toHaveText(SERVICE.sourceTitle);
	await publish(page, endpoint(editor));
	await visitor.reload();
	await expect(related).toHaveText(SERVICE.de);

	const russianQuery = new URLSearchParams({ q: SERVICE.sourceTitle });
	await visitor.goto(`${sitePath(ROUTES.search, LOCALES.de)}?${russianQuery}`);
	const germanHit = visitor.getByRole("link", {
		name: SERVICE.de,
		exact: true,
	});
	await expect(germanHit).toHaveAttribute(
		"href",
		publicPath(SERVICE, LOCALES.de),
	);
	await expect(germanHit.locator("..")).toHaveAttribute("lang", LOCALES.de);

	const query = new URLSearchParams({ q: SERVICE.enSummary });
	await visitor.goto(`${sitePath(ROUTES.search, LOCALES.en)}?${query}`);
	await expect(
		visitor.getByRole("link", { name: SERVICE.sourceTitle, exact: true }),
	).toHaveAttribute("href", publicPath(SERVICE, LOCALES.en));
});

test("project shares its gallery and resolves case-study text independently by language", async ({
	request,
	managerPage: page,
	visitorPage: visitor,
}) => {
	const id = await createLayoutProject(request);
	const editor = { ...PROJECT, id };
	try {
		await page.goto(editorPath(editor, LOCALES.en));
		await page.locator('input[name="title"]').fill(PROJECT.en);
		await page
			.getByRole("button", { name: "Фото и видео", exact: true })
			.click();
		await page
			.locator('input[name="gallery.0.caption"]')
			.fill(PROJECT.enCaption);
		await saveDraft(page, endpoint(editor));

		await page.goto(editorPath(editor, LOCALES.de));
		await page.getByRole("button", { name: "Содержание", exact: true }).click();
		const task = page.locator('textarea[name="task"]');
		await expect(task).toBeEditable();
		await task.fill(PROJECT.deTask);
		await saveDraft(page, endpoint(editor));

		const preview = await openPreview(page, editor, LOCALES.de);
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			LAYOUT_PROJECT.title,
		);
		await expect(
			preview.getByText(PROJECT.deTask, { exact: true }),
		).toHaveAttribute("lang", LOCALES.de);
		await expect(preview.locator("figcaption")).toHaveText(
			LAYOUT_PROJECT.caption,
		);
		await preview.goto(publicPath(PROJECT, LOCALES.en));
		await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
			PROJECT.en,
		);
		await expect(
			preview.getByText(PROJECT.sourceTask, { exact: true }),
		).toHaveAttribute("lang", LOCALES.ru);
		await expect(preview.locator("figcaption")).toHaveText(PROJECT.enCaption);
		await closePreview(preview);

		await visitor.goto(publicPath(PROJECT, LOCALES.de));
		await expect(visitor.getByText(PROJECT.deTask)).toHaveCount(0);
		await expect(
			visitor.getByText(PROJECT.sourceTask, { exact: true }),
		).toBeVisible();
	} finally {
		await deleteLayoutProject(request, id);
	}
});
