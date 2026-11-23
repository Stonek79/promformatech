import { APPEARANCE, TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { ROUTES } from "../../src/config/content";
import { LOCALES, SITE_LANGUAGES } from "../../src/i18n/config";
import { getMessages } from "../../src/i18n/messages";
import { sitePath } from "../../src/i18n/site-path";
import { expect, test } from "./support/admin";
import { setTextSize, setTheme } from "./support/appearance";
import { checkPublicLayout, settlePublicPage } from "./support/public-layout";

const PRODUCT = `${ROUTES.products}/ball-guide-pillar-a-trp`;
const MOBILE = { width: 320, height: 844 };
const DESKTOP_WIDTHS = [1920, 2560];
const DESKTOP_HEIGHT = 1080;
const ru = getMessages();
const en = getMessages(LOCALES.en);
const de = getMessages(LOCALES.de);
const MOSCOW_EN = "3 Marshala Sokolovskogo Street, 4th floor, Moscow";
const MOSCOW_DE = "Marschala-Sokolowskogo-Straße 3, 4. Stock, Moskau";

test("home keeps Russian steps after switching to an untranslated language", async ({
	page,
}) => {
	await page.setViewportSize(MOBILE);
	await page.goto(ROUTES.home);
	const steps = page.locator("main section").filter({
		has: page.getByRole("heading", {
			name: "Этапы сотрудничества",
			exact: true,
		}),
	});
	const russianTitles = steps.locator('li h3[lang="ru"]');
	await expect(russianTitles).toHaveCount(6);
	for (const [current, next] of [
		[LOCALES.ru, LOCALES.en],
		[LOCALES.en, LOCALES.de],
	] as const) {
		await page
			.getByRole("button", {
				name: getMessages(current).navigation.changeLanguage(
					SITE_LANGUAGES[current].name,
				),
			})
			.click();
		await page
			.getByRole("link", { name: SITE_LANGUAGES[next].name, exact: true })
			.click();
		await expect(page).toHaveURL(sitePath(ROUTES.home, next));
		const wordmarks = page.locator('[data-stock="true"]');
		await expect(wordmarks).toHaveCount(2);
		for (const wordmark of await wordmarks.all()) {
			await expect(wordmark).toHaveText(getMessages(next).common.brand);
			await expect(wordmark).toHaveCSS("white-space", "nowrap");
			await expect(wordmark.locator("span")).toHaveCSS(
				"color",
				"rgb(98, 147, 213)",
			);
		}
		await expect(russianTitles).toHaveCount(6);
		await expect(steps.locator('li p[lang="ru"]')).toHaveCount(6);
		await expect(steps.getByText("5–10 дней", { exact: true })).toHaveAttribute(
			"lang",
			LOCALES.ru,
		);
		await page.reload();
		await expect(russianTitles).toHaveCount(6);
	}
});

test("contacts use the whole map as a link and reveal its address", async ({
	page,
	context,
}) => {
	await context.route("https://www.openstreetmap.org/**", (route) =>
		route.fulfill({ contentType: "text/html", body: "<title>Map</title>" }),
	);
	await page.setViewportSize(MOBILE);
	await page.goto(sitePath(ROUTES.contact, LOCALES.en));
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(
		en.navigation.items.contact,
	);
	await expect(page).toHaveTitle(
		`${en.navigation.items.contact} — ${en.common.brand}`,
	);
	await expect(page.locator("body")).toHaveCSS("font-size", "16px");

	const address = MOSCOW_EN;
	const map = page.getByRole("link", { name: en.map.openAddress(address) });
	const office = page
		.locator('main section[data-map-position="beside"]')
		.filter({
			has: map,
		});
	const image = map.locator("img");
	await expect(image).toBeVisible();
	await expect
		.poll(() =>
			image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
		)
		.toBeGreaterThan(0);
	const caption = map.getByText(address, { exact: true });
	await expect(caption).toBeHidden();
	await page.keyboard.press("Tab");
	await map.focus();
	await expect(caption).toBeVisible();
	await checkPublicLayout(page);
	await setTextSize(page, TEXT_SIZES.larger, LOCALES.en);
	await checkPublicLayout(page);

	const opened = context.waitForEvent("page");
	await map.click();
	const target = await opened;
	await target.waitForLoadState();
	expect(new URL(target.url()).searchParams.get("mlat")).toBe("55.79323");
	await target.close();

	for (const width of [320, 390, 693, 1440, 1920]) {
		await page.setViewportSize({ ...MOBILE, width });
		const grid = await office.evaluate((section) => {
			const details = section.firstElementChild?.getBoundingClientRect();
			const preview = section.lastElementChild?.getBoundingClientRect();
			const phones = Array.from(section.querySelectorAll('a[href^="tel:"]'));
			const emails = Array.from(section.querySelectorAll('a[href^="mailto:"]'));
			return {
				columns: [details?.width ?? 0, preview?.width ?? 0],
				mapBelow: (preview?.top ?? 0) >= (details?.bottom ?? 0),
				people: phones.map(
					(link) => link.parentElement?.getBoundingClientRect().width ?? 0,
				),
				phoneRows: phones.map((link) => link.getBoundingClientRect().top),
				emailRows: emails.map((link) => link.getBoundingClientRect().top),
			};
		});
		if (width >= 1440) {
			expect(grid.mapBelow).toBe(false);
			expect(grid.columns[0]).toBeCloseTo(grid.columns[1], 0);
			expect(grid.people[0]).toBeCloseTo(grid.people[1], 0);
			expect(grid.phoneRows[0]).toBeCloseTo(grid.phoneRows[1], 0);
			expect(grid.emailRows[0]).toBeCloseTo(grid.emailRows[1], 0);
		} else {
			expect(grid.mapBelow).toBe(true);
			if (width <= 390) {
				expect(grid.phoneRows[1]).toBeGreaterThan(grid.phoneRows[0]);
			}
		}
		const contacts = page.locator(
			'main :is(a[href^="tel:"], a[href^="mailto:"])',
		);
		const clipped = await contacts.evaluateAll((links) =>
			links
				.filter((link) => link.scrollWidth > link.clientWidth)
				.map((link) => link.textContent),
		);
		expect(clipped).toEqual([]);
		await checkPublicLayout(page);
	}
	for (const locale of [LOCALES.ru, LOCALES.de]) {
		const { navigation, common } = getMessages(locale);
		await page.goto(sitePath(ROUTES.contact, locale));
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(
			navigation.items.contact,
		);
		await expect(page).toHaveTitle(
			`${navigation.items.contact} — ${common.brand}`,
		);
	}
});

test("language switch keeps the current material, preferences and browser history", async ({
	page,
}) => {
	await page.setViewportSize(MOBILE);
	await page.goto(PRODUCT);
	await settlePublicPage(page);
	const heading = page.getByRole("heading", { level: 1 });
	const title = (await heading.textContent())?.trim() ?? "";
	expect(title).not.toBe("");
	await setTheme(page, THEMES.dark);
	await setTextSize(page, TEXT_SIZES.larger);
	const themePosition = await page.getByRole("switch").boundingBox();
	expect(themePosition).not.toBeNull();
	const selector = page.getByRole("button", {
		name: ru.navigation.changeLanguage(SITE_LANGUAGES.ru.name),
	});
	await selector.focus();
	await page.keyboard.press("Enter");
	const popup = page.getByRole("dialog", { name: ru.navigation.languages });
	await expect(popup).toBeVisible();
	await expect(
		popup.getByRole("link", { name: SITE_LANGUAGES.ru.name }),
	).toHaveAttribute("aria-current", "true");
	await page.keyboard.press("Escape");
	await expect(popup).not.toBeVisible();
	await expect(selector).toBeFocused();
	await selector.click();
	await popup.getByRole("link", { name: SITE_LANGUAGES.en.name }).click();
	await expect(page).toHaveURL(sitePath(PRODUCT, LOCALES.en));
	await expect(page.locator("html")).toHaveAttribute("lang", LOCALES.en);
	expect(await page.getByRole("switch").boundingBox()).toEqual(themePosition);
	const footer = page.getByRole("contentinfo");
	await expect(footer.getByText(MOSCOW_EN)).toBeVisible();
	const map = footer.getByRole("link", { name: MOSCOW_EN });
	const mapURL = new URL((await map.getAttribute("href")) ?? "");
	expect(mapURL.hostname).toBe("www.openstreetmap.org");
	expect(mapURL.searchParams.get("mlat")).toBeTruthy();
	await checkPublicLayout(page);
	await page
		.getByRole("button", {
			name: en.navigation.changeLanguage(SITE_LANGUAGES.en.name),
		})
		.click();
	await page.getByRole("link", { name: SITE_LANGUAGES.de.name }).click();
	await expect(page).toHaveURL(sitePath(PRODUCT, LOCALES.de));
	await expect(page.locator("html")).toHaveAttribute("lang", LOCALES.de);
	await expect(heading).toHaveText(title);
	await expect(heading).toHaveAttribute("lang", LOCALES.ru);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.themeAttribute,
		THEMES.dark,
	);
	await expect(page.locator("html")).toHaveAttribute(
		APPEARANCE.sizeAttribute,
		TEXT_SIZES.larger,
	);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
		"content",
		/noindex/,
	);
	expect(await page.getByRole("switch").boundingBox()).toEqual(themePosition);
	await expect(footer.getByText(MOSCOW_DE)).toBeVisible();
	await expect(
		page.getByRole("banner").getByRole("link", {
			name: de.navigation.homeLabel(de.common.brand),
		}),
	).toBeVisible();
	await checkPublicLayout(page);
	await page.goBack();
	await expect(page.locator("html")).toHaveAttribute("lang", LOCALES.en);
});

test("German navigation and search fit the screen and preserve the query", async ({
	page,
}) => {
	for (const width of DESKTOP_WIDTHS) {
		await page.setViewportSize({ width, height: DESKTOP_HEIGHT });
		await page.goto(sitePath(ROUTES.products, LOCALES.de));
		await expect(
			page
				.getByRole("navigation", { name: de.navigation.mainMenu })
				.getByRole("link", { name: de.navigation.items.products }),
		).toBeVisible();
		await settlePublicPage(page);
		await checkPublicLayout(page);
	}
	await page.setViewportSize(MOBILE);
	await page.getByRole("button", { name: de.navigation.openSearch }).click();
	const search = page.getByRole("dialog", { name: de.labels.searchTitle });
	await expect(search).toBeVisible();
	const input = search.getByRole("searchbox");
	await expect(input).toHaveAttribute(
		"placeholder",
		de.labels.searchPlaceholder,
	);
	const query = "Ölführungsprüfung";
	await input.fill(query);
	await expect(search.getByRole("status")).toHaveText(de.labels.emptySearch);
	await input.press("Enter");
	await expect(page).toHaveURL(
		`${sitePath(ROUTES.search, LOCALES.de)}?q=${encodeURIComponent(query)}`,
	);
	await expect(page.getByText(de.labels.emptySearch)).toBeVisible();
	await expect(page).toHaveTitle(de.navigation.search);
	await checkPublicLayout(page);
	await page
		.getByRole("button", {
			name: de.navigation.changeLanguage(SITE_LANGUAGES.de.name),
		})
		.click();
	await expect(
		page.getByRole("link", { name: SITE_LANGUAGES.en.name }),
	).toHaveAttribute(
		"href",
		`${sitePath(ROUTES.search, LOCALES.en)}?q=${encodeURIComponent(query)}`,
	);
});
