import type { Page } from "@playwright/test";
import { adminCollectionURL, collectionAPIURL } from "../../src/config/cms";
import { COLLECTIONS, PAGE_SLUGS, ROUTES } from "../../src/config/content";
import {
	LOCALES,
	type Locale,
	SITE_LANGUAGE_QUERY,
} from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath } from "../../src/i18n/site-path";
import {
	closePreview,
	expect,
	publish,
	saveDraft,
	test,
} from "./support/admin";
import { E2E_HEADERS } from "./support/config";

const ENGLISH = {
	title: "Industrial experience",
	heading: "About our industrial team",
	blockHeading: "How we work",
	body: "We prepare and commission industrial equipment.",
};
const GERMAN = {
	title: "Unsere Industrieerfahrung",
	heading: "Unser Industrieteam",
	blockHeading: "So arbeiten wir",
};
const SOURCE_ARTICLE = /Китайско-российская команда координирует производство/;
const articleURL = (locale: Locale) => sitePath(ROUTES.about, locale);

function localeEditor(id: number, locale: Locale) {
	return `${adminCollectionURL(COLLECTIONS.pages, id)}?${SITE_LANGUAGE_QUERY}=${locale}`;
}

async function editArticle(
	page: Page,
	id: number,
	locale: typeof LOCALES.en | typeof LOCALES.de,
) {
	const translation = locale === LOCALES.en ? ENGLISH : GERMAN;
	await page.goto(localeEditor(id, locale));
	await page.locator('input[name="title"]').fill(translation.title);
	await page.locator('input[name="heading"]').fill(translation.heading);
	await page
		.locator('input[name="blocks.1.heading"]')
		.fill(translation.blockHeading);
	const editor = page
		.locator('[contenteditable="true"][data-lexical-editor="true"]')
		.nth(1);
	await expect(editor).toHaveText("");
	if (locale === LOCALES.en) {
		await editor.fill(ENGLISH.body);
	}
	await saveDraft(page, collectionAPIURL(COLLECTIONS.pages, id));
}

test("manager previews localized article drafts and Russian fallback before publication", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	const query = new URLSearchParams({
		"where[slug][equals]": PAGE_SLUGS.about,
		depth: "0",
	});
	const response = await page.request.get(
		`${collectionAPIURL(COLLECTIONS.pages)}?${query}`,
		{ headers: E2E_HEADERS },
	);
	expect(response.ok()).toBe(true);
	const result = await response.json();
	expect(result.totalDocs).toBe(1);
	const id: number = result.docs[0].id;

	await editArticle(page, id, LOCALES.en);
	await editArticle(page, id, LOCALES.de);

	const popup = page.waitForEvent("popup");
	await page.getByRole("link", { name: "Предпросмотр", exact: true }).click();
	const preview = await popup;
	await expect(preview).toHaveURL(articleURL(LOCALES.de));
	await expect(
		preview.getByText(getMessages(LOCALES.de).preview.status),
	).toBeVisible();
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		GERMAN.heading,
	);
	await expect(
		preview.getByRole("heading", { name: GERMAN.blockHeading }),
	).toHaveAttribute("lang", LOCALES.de);
	await expect(
		preview.locator('article [lang="ru"]').getByText(SOURCE_ARTICLE),
	).toBeVisible();
	await expect(
		preview.getByRole("link", { name: getMessages(LOCALES.de).preview.back }),
	).toHaveAttribute("href", localeEditor(id, LOCALES.de));

	await preview.goto(articleURL(LOCALES.en));
	await expect(
		preview.getByText(getMessages(LOCALES.en).preview.status),
	).toBeVisible();
	await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
		ENGLISH.heading,
	);
	await expect(
		preview.locator('article [lang="en"]').getByText(ENGLISH.body),
	).toBeVisible();
	await expect(preview.getByText(SOURCE_ARTICLE)).toHaveCount(0);
	await closePreview(preview);

	for (const locale of [LOCALES.en, LOCALES.de]) {
		await visitor.goto(articleURL(locale));
		await expect(visitor.getByText(SOURCE_ARTICLE)).toBeVisible();
		await expect(visitor.getByText(ENGLISH.body)).toHaveCount(0);
		await expect(visitor.getByText(GERMAN.heading)).toHaveCount(0);
	}

	await publish(page, collectionAPIURL(COLLECTIONS.pages, id));
	await visitor.reload();
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		GERMAN.heading,
	);
	await expect(
		visitor.locator('article [lang="ru"]').getByText(SOURCE_ARTICLE),
	).toBeVisible();
	await visitor.goto(articleURL(LOCALES.en));
	await expect(visitor.getByRole("heading", { level: 1 })).toHaveText(
		ENGLISH.heading,
	);
	await expect(visitor.getByText(ENGLISH.body)).toBeVisible();

	const search = new URLSearchParams({ q: ENGLISH.title });
	await visitor.goto(`${sitePath(ROUTES.search, LOCALES.en)}?${search}`);
	await expect(
		visitor.getByRole("link", { name: ENGLISH.title }),
	).toHaveAttribute("href", articleURL(LOCALES.en));
});
