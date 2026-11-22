import { describe, expect, it } from "vitest";
import { PAGE_KINDS } from "../../src/config/content";
import { localizedText } from "../../src/features/content/localized-fields";
import { pageHeading } from "../../src/features/content/page-locales";
import { DEFAULT_LOCALE, LOCALES, parseLocale } from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath, splitSitePath } from "../../src/i18n/site-path";

const article = {
	id: 1,
	slug: "about",
	title: "О компании",
	kind: PAGE_KINDS.content,
	updatedAt: "",
	createdAt: "",
};

describe("locale selection", () => {
	it.each([undefined, null, {}, "__proto__", "zh-Hans", "not-a-locale"])(
		"falls back safely for unsupported locale %j",
		(value) => {
			expect(parseLocale(value)).toBe(DEFAULT_LOCALE);
		},
	);

	it("resolves German UI copy using the language of the interface", () => {
		expect(getMessages(parseLocale("de")).navigation.openSearch).toBe(
			"Suche öffnen",
		);
	});

	it.each([
		["/products/item", LOCALES.en, "/en/products/item"],
		["/en/search?q=1#top", LOCALES.de, "/de/search?q=1#top"],
		["/de", LOCALES.ru, "/"],
		["/api/health/ready", LOCALES.de, "/api/health/ready"],
		["/media/1/image", LOCALES.de, "/media/1/image"],
		["/templates/example.csv", LOCALES.de, "/templates/example.csv"],
		[
			"https://example.com/products",
			LOCALES.de,
			"https://example.com/products",
		],
		["#contact", LOCALES.de, "#contact"],
	])("converts %s to the public URL for %s", (href, locale, expected) => {
		expect(sitePath(href, locale)).toBe(expected);
	});

	it("keeps an unsupported segment available as a CMS slug", () => {
		expect(splitSitePath("/zh/contacts")).toEqual({
			locale: undefined,
			pathname: "/zh/contacts",
		});
	});

	it("uses the source language for empty or whitespace-only translations", () => {
		expect(localizedText(LOCALES.de, "  ", "Русский текст")).toEqual({
			value: "Русский текст",
			lang: LOCALES.ru,
		});
		expect(
			localizedText(LOCALES.en, "Translated text", "Русский текст"),
		).toEqual({
			value: "Translated text",
			lang: LOCALES.en,
		});
	});

	it.each(["-", ".", " — ", "…"])(
		"uses the page title when the saved heading is the placeholder %j",
		(heading) => {
			expect(
				pageHeading({ page: { ...article, heading }, locale: LOCALES.ru }),
			).toEqual({ value: article.title, lang: LOCALES.ru });
			expect(
				pageHeading({
					page: { ...article, heading, title: "Über uns" },
					source: { ...article, heading },
					locale: LOCALES.de,
				}),
			).toEqual({ value: "Über uns", lang: LOCALES.de });
		},
	);

	it("keeps a real heading that includes a dash", () => {
		const heading = "ПромФормаТех — в России";
		expect(
			pageHeading({ page: { ...article, heading }, locale: LOCALES.ru }),
		).toEqual({ value: heading, lang: LOCALES.ru });
	});
});
