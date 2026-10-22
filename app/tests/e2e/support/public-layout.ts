import type { Page } from "@playwright/test";
import { expect } from "./admin";

const GEOMETRY_TOLERANCE = 2;
const CONTENT_SELECTOR = "header, main, footer, [role=dialog]";

export async function checkPublicLayout(page: Page) {
	const problems = await page.evaluate(
		({ tolerance, selector }) => {
			const issues: string[] = [];
			const root = document.documentElement;
			if (root.scrollWidth > innerWidth + tolerance) {
				issues.push(`Page width ${root.scrollWidth} exceeds ${innerWidth}`);
			}
			const elements = document.querySelectorAll<HTMLElement>(
				selector
					.split(", ")
					.map((part) => `${part} *`)
					.join(", "),
			);
			for (const element of elements) {
				const bounds = element.getBoundingClientRect();
				if (!bounds.width || !bounds.height) {
					continue;
				}
				const style = getComputedStyle(element);
				if (style.visibility !== "visible") {
					continue;
				}
				const name = `${element.tagName} ${element.textContent?.trim().slice(0, 70)}`;
				if (bounds.left < -tolerance || bounds.right > innerWidth + tolerance) {
					issues.push(`Outside viewport: ${name}`);
				}
				// Inputs intentionally scroll their value; images may intentionally use cover.
				if (
					element.matches("input, textarea, select, img, video, svg, svg *")
				) {
					continue;
				}
				if (
					style.overflowX === "hidden" &&
					element.scrollWidth > element.clientWidth + tolerance
				) {
					issues.push(`Clipped horizontally: ${name}`);
				}
				if (
					style.overflowY === "hidden" &&
					element.scrollHeight > element.clientHeight + tolerance
				) {
					issues.push(`Clipped vertically: ${name}`);
				}
			}
			return [...new Set(issues)];
		},
		{ tolerance: GEOMETRY_TOLERANCE, selector: CONTENT_SELECTOR },
	);
	expect(problems, page.url()).toEqual([]);
}

export async function settlePublicPage(page: Page) {
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	await page.evaluate(async () => {
		await document.fonts.ready;
		for (const image of document.querySelectorAll("main img, footer img")) {
			if (image instanceof HTMLImageElement) {
				image.loading = "eager";
				await image.decode();
			}
		}
	});
}
