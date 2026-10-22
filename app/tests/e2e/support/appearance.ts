import type { Page } from "@playwright/test";
import {
	TEXT_SIZE_OPTIONS,
	type TextSize,
	THEMES,
} from "../../../src/config/appearance";
import { getMessages } from "../../../src/i18n/messages";
import { expect } from "./admin";

const messages = getMessages().appearance;

export function themeSwitch(page: Page) {
	return page.getByRole("switch", { name: messages.darkTheme, exact: true });
}

export function sizeButton(page: Page) {
	return page.getByRole("button", { name: messages.sizeAction("") });
}

export async function setTheme(
	page: Page,
	theme: typeof THEMES.light | typeof THEMES.dark,
) {
	const control = themeSwitch(page);
	const checked = theme === THEMES.dark;
	if ((await control.getAttribute("aria-checked")) !== String(checked)) {
		await control.click();
	}
	await expect(control).toHaveAttribute("aria-checked", String(checked));
}

export async function setTextSize(page: Page, size: TextSize) {
	const control = sizeButton(page);
	const label = messages.sizeAction(messages.sizes[size]);
	for (const _option of TEXT_SIZE_OPTIONS) {
		if ((await control.getAttribute("aria-label")) === label) {
			return;
		}
		await control.click();
	}
	await expect(control).toHaveAccessibleName(label);
}

export async function checkSizeControl(page: Page, size: TextSize) {
	await expect(sizeButton(page)).toBeInViewport();
	await expect(sizeButton(page)).toHaveAccessibleName(
		messages.sizeAction(messages.sizes[size]),
	);
	await expect(page.getByRole("dialog")).toHaveCount(0);
	await expect(page.getByRole("menu")).toHaveCount(0);
}
