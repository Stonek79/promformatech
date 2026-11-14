import type { Locator } from "@playwright/test";
import { TEXT_SIZES, THEMES } from "../../src/config/appearance";
import { COLLECTIONS, PUBLICATION, ROUTES } from "../../src/config/content";
import { MEDIA_STATUS } from "../../src/config/media";
import { expect, test } from "./support/admin";
import { setTextSize, setTheme } from "./support/appearance";
import { login } from "./support/auth";
import { checkPublicLayout } from "./support/public-layout";

const API = `${ROUTES.api}/${COLLECTIONS.products}`;
const FIXTURE_PHOTO = "Промышленные роботы на производстве";
const PRODUCTS = [
	{ title: "Втулка", summary: "Направляющая деталь.", order: -2 },
	{
		title: "Высокоточная направляющая для автоматизированной линии",
		summary:
			"Комплектующая для высокоскоростной штамповки. Подходит для последовательных штампов. Маркировка: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.",
		order: -1,
	},
] as const;
const VIEWPORTS = [
	{ width: 320, columns: 1 },
	{ width: 820, columns: 2 },
	{ width: 1280, columns: 3 },
	{ width: 1920, columns: 4, outerGutter: 160 },
	{ width: 2560, columns: 4, outerGutter: 480 },
] as const;
const HEIGHT = 1000;
const MAX_FRAME_WIDTH = 1600;
const TOLERANCE = 1;
const MAX_CARD_WIDTH = 450;
const PHOTO_RATIO = 4 / 3;

function measureCards(cards: Locator) {
	return cards.evaluateAll((elements) =>
		elements.map((card) => {
			const heading = card.querySelector("h2, h3");
			const summary = card.querySelector("p");
			const photo = card.querySelector("img")?.parentElement;
			if (!heading || !summary || !photo) {
				throw new Error(
					"Product card is missing its heading, summary, or photo",
				);
			}
			const bounds = card.getBoundingClientRect();
			const photoBounds = photo.getBoundingClientRect();
			const textBounds = [heading, summary].flatMap((element) => {
				const range = document.createRange();
				range.selectNodeContents(element);
				return [...range.getClientRects()];
			});
			return {
				top: bounds.top,
				bottom: bounds.bottom,
				left: bounds.left,
				right: bounds.right,
				width: bounds.width,
				heading: heading.getBoundingClientRect().top,
				summary: summary.getBoundingClientRect().top,
				photoRatio: photoBounds.width / photoBounds.height,
				textFits: textBounds.every(
					(rect) =>
						rect.left >= bounds.left &&
						rect.right <= bounds.right &&
						rect.top >= bounds.top &&
						rect.bottom <= bounds.bottom,
				),
			};
		}),
	);
}

test("product card rows align headings and descriptions at larger text sizes", async ({
	page,
	request,
}) => {
	await login(request, "owner");
	const cards = page.locator(`main a[href^="${ROUTES.products}/"]`).filter({
		has: page.getByRole("heading"),
	});
	await page.goto(ROUTES.products);
	await expect(cards.first()).toBeVisible();
	const initialCount = await cards.count();
	expect(initialCount + PRODUCTS.length).toBeGreaterThanOrEqual(
		Math.max(...VIEWPORTS.map(({ columns }) => columns)),
	);
	const createdIDs: number[] = [];
	try {
		const media = await request.get(`${ROUTES.api}/${COLLECTIONS.media}`, {
			params: {
				"where[title][equals]": FIXTURE_PHOTO,
				"where[processingStatus][equals]": MEDIA_STATUS.ready,
				limit: 1,
			},
		});
		expect(media.ok()).toBe(true);
		const { docs } = await media.json();
		const featuredImage: unknown = docs[0]?.id;
		expect(typeof featuredImage).toBe("number");
		for (const product of PRODUCTS) {
			const response = await request.post(API, {
				data: { ...product, featuredImage, _status: PUBLICATION.published },
			});
			expect(response.ok(), await response.text()).toBe(true);
			const { doc } = await response.json();
			createdIDs.push(doc.id);
		}

		await page.goto(ROUTES.products);
		await expect(cards).toHaveCount(initialCount + PRODUCTS.length);
		await page.evaluate(() => document.fonts.ready.then(() => undefined));
		await expect(cards.first().locator("img")).toHaveAttribute(
			"loading",
			"eager",
		);

		for (const theme of [THEMES.light, THEMES.dark]) {
			await setTheme(page, theme);
			for (const size of [TEXT_SIZES.standard, TEXT_SIZES.larger]) {
				await setTextSize(page, size);
				for (const viewport of VIEWPORTS) {
					const { width, columns } = viewport;
					await test.step(`${width}px / ${theme} / ${size}`, async () => {
						await page.setViewportSize({ width, height: HEIGHT });
						const layout = await measureCards(cards);
						const firstRow = layout.filter(
							(card) => card.top === layout[0].top,
						);
						expect(firstRow).toHaveLength(columns);
						if ("outerGutter" in viewport) {
							const frame = await page
								.locator("#main-content > div")
								.boundingBox();
							expect(frame?.width).toBe(MAX_FRAME_WIDTH);
							expect(frame?.x).toBeCloseTo(viewport.outerGutter);
							expect(firstRow[0].left).toBeCloseTo(
								width - firstRow[columns - 1].right,
								0,
							);
						}
						for (const card of layout) {
							expect(card.width).toBeLessThanOrEqual(
								MAX_CARD_WIDTH + TOLERANCE,
							);
							expect(card.textFits).toBe(true);
							expect(card.photoRatio).toBeCloseTo(PHOTO_RATIO, 2);
							const rowStart = layout.find((other) => other.top === card.top);
							expect(card.bottom).toBeCloseTo(rowStart?.bottom ?? 0, 0);
							expect(card.heading).toBeCloseTo(rowStart?.heading ?? 0, 0);
							expect(card.summary).toBeCloseTo(rowStart?.summary ?? 0, 0);
						}
						await checkPublicLayout(page);
					});
				}
			}
		}
		await page.setViewportSize({ width: 1920, height: HEIGHT });
		await cards.last().scrollIntoViewIfNeeded();
	} finally {
		for (const id of createdIDs) {
			expect((await request.delete(`${API}/${id}`)).ok()).toBe(true);
		}
	}
});
