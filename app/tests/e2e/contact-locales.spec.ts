import type { Page } from "@playwright/test";
import { adminGlobalURL } from "../../src/config/cms";
import { GLOBALS, ROUTES } from "../../src/config/content";
import {
	DEFAULT_LOCALE,
	LOCALES,
	type Locale,
	SITE_LANGUAGE_QUERY,
} from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath } from "../../src/i18n/site-path";
import { closePreview, expect, saveDraft, test } from "./support/admin";

const MAP_URL = "https://www.openstreetmap.org/way/27633747";
const SETTINGS_ENDPOINT = `${ROUTES.api}/globals/${GLOBALS.site}`;
const DRAFTS = {
	[LOCALES.ru]: {
		address: "Тестовый адрес в Москве",
		office: "Тестовый офис в Москве",
		position: "Начальник испытательной лаборатории",
		menu: "Открыть начало сайта",
		footerLink: "Проекты в подвале",
		footerTitle: "Обращайтесь к нам",
		hours: "По будням с 10 до 17",
		copyright: "Тестовая подпись владельца",
	},
	[LOCALES.en]: {
		address: "Test address in Moscow",
		office: "Test office in Moscow",
		position: "",
		menu: "Open the start page",
		footerLink: "Projects in the footer",
		footerTitle: "Get in touch with us",
		hours: "Weekdays from 10 to 17",
		copyright: "",
	},
	[LOCALES.de]: {
		address: "Testadresse in Moskau",
		office: "Testbüro in Moskau",
		position: "Leiter des Prüflabors",
		menu: "",
		footerLink: "",
		footerTitle: "Nehmen Sie Kontakt auf",
		hours: "Werktags von 10 bis 17 Uhr",
		copyright: "Hinweis des Testinhabers",
	},
} satisfies Record<Locale, Record<string, string>>;

async function editLocale(page: Page, locale: Locale) {
	const values = DRAFTS[locale];
	const url = `${adminGlobalURL(GLOBALS.site)}?${new URLSearchParams({
		[SITE_LANGUAGE_QUERY]: locale,
	})}`;
	await page.goto(url);
	await page.getByText("Контакты", { exact: true }).last().click();
	await page.locator('[name="locations.0.address"]').fill(values.address);
	await page.locator('[name="locations.0.title"]').fill(values.office);
	await page
		.locator('[name="locations.0.people.0.position"]')
		.fill(values.position);
	if (locale === LOCALES.de) {
		await page
			.getByRole("textbox", { name: "Ссылка на точку на карте", exact: true })
			.first()
			.fill(MAP_URL);
	}

	await page.getByText("Меню и подвал", { exact: true }).click();
	await page.locator('[name="navigation.0.label"]').fill(values.menu);
	if (locale === DEFAULT_LOCALE) {
		await page
			.getByRole("button", { name: "Добавить ссылку", exact: true })
			.click();
		await page.locator('[name="footerLinks.0.url"]').fill(ROUTES.projects);
	}
	await page.locator('[name="footerLinks.0.label"]').fill(values.footerLink);
	await page.locator('[name="footerTitle"]').fill(values.footerTitle);
	await page.locator('[name="hours"]').fill(values.hours);
	await page.locator('[name="copyright"]').fill(values.copyright);
	await saveDraft(page, SETTINGS_ENDPOINT);
}

function visibleCopy(locale: Locale, key: keyof (typeof DRAFTS)[Locale]) {
	const value = DRAFTS[locale][key];
	return value
		? [value, locale]
		: [DRAFTS[DEFAULT_LOCALE][key], DEFAULT_LOCALE];
}

async function verifyPreview(preview: Page, locale: Locale) {
	const messages = getMessages(locale);
	await expect(preview.getByText(messages.preview.status)).toBeVisible();
	const main = preview.getByRole("main");
	const { address, office } = DRAFTS[locale];
	await expect(
		main.getByText(address, { exact: true }).first(),
	).toHaveAttribute("lang", locale);
	await expect(main.getByRole("heading", { name: office })).toHaveAttribute(
		"lang",
		locale,
	);
	const [position, positionLang] = visibleCopy(locale, "position");
	await expect(
		main.getByText(`— ${position}`, { exact: true }),
	).toHaveAttribute("lang", positionLang);
	if (locale !== DEFAULT_LOCALE) {
		await expect(main.locator('address p[lang="ru"]').first()).toBeVisible();
	}
	await expect(
		main.getByRole("link", { name: messages.map.openAddress(address) }),
	).toHaveAttribute("href", MAP_URL);

	const [menu, menuLang] = visibleCopy(locale, "menu");
	const menuLink = preview
		.getByRole("navigation", { name: messages.navigation.mainMenu })
		.getByRole("link", { name: menu, exact: true });
	await expect(menuLink).toHaveAttribute("lang", menuLang);
	await expect(menuLink).toHaveAttribute("href", sitePath(ROUTES.home, locale));

	const footer = preview.getByRole("contentinfo");
	await expect(footer.getByRole("link", { name: address })).toHaveAttribute(
		"href",
		MAP_URL,
	);
	const [link, linkLang] = visibleCopy(locale, "footerLink");
	const footerLink = footer.getByRole("link", { name: link, exact: true });
	await expect(footerLink).toHaveAttribute("lang", linkLang);
	await expect(footerLink).toHaveAttribute(
		"href",
		sitePath(ROUTES.projects, locale),
	);
	for (const key of ["footerTitle", "hours", "copyright"] as const) {
		const [text, lang] = visibleCopy(locale, key);
		await expect(footer.getByText(text, { exact: true })).toHaveAttribute(
			"lang",
			lang,
		);
	}
}

test("manager previews office, navigation and footer translations with Russian fallback", async ({
	managerPage: page,
	visitorPage: visitor,
}) => {
	for (const locale of Object.values(LOCALES)) {
		await editLocale(page, locale);
	}
	const opening = page.waitForEvent("popup");
	await page.getByRole("link", { name: "Предпросмотр", exact: true }).click();
	const preview = await opening;
	await expect(preview).toHaveURL(sitePath(ROUTES.contact, LOCALES.de));
	await preview.waitForLoadState("load");
	for (const locale of Object.values(LOCALES)) {
		const path = sitePath(ROUTES.contact, locale);
		await preview.goto(path);
		await verifyPreview(preview, locale);
		await visitor.goto(path);
		for (const key of ["office", "address", "menu", "footerTitle"] as const) {
			const [value] = visibleCopy(locale, key);
			await expect(visitor.getByText(value, { exact: true })).toHaveCount(0);
		}
		await expect(
			visitor.getByText(getMessages(locale).preview.status),
		).toHaveCount(0);
	}
	await visitor.goto(sitePath(ROUTES.about, LOCALES.de));
	await expect(
		visitor
			.getByRole("article")
			.locator('[lang="ru"]')
			.getByText(/Мы входим в группу Ningbo Linyue/),
	).toBeVisible();
	await closePreview(preview);
});
