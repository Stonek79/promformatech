import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { Page } from "@/payload-types";

export type ArticleBlock = NonNullable<Page["blocks"]>[number];

export function blockOfType<T extends ArticleBlock["blockType"]>(
	block: ArticleBlock | undefined,
	type: T,
): Extract<ArticleBlock, { blockType: T }> | undefined {
	if (block?.blockType === type) {
		return block as Extract<ArticleBlock, { blockType: T }>;
	}
	return undefined;
}

function containsText(node: unknown): boolean {
	if (!node || typeof node !== "object") {
		return false;
	}
	if ("text" in node && typeof node.text === "string" && node.text.trim()) {
		return true;
	}
	return (
		"children" in node &&
		Array.isArray(node.children) &&
		node.children.some(containsText)
	);
}

export function localizedBody(
	locale: Locale,
	value: unknown,
	original: unknown,
) {
	if (locale === DEFAULT_LOCALE) {
		return { data: value, language: locale };
	}
	if (
		value &&
		typeof value === "object" &&
		"root" in value &&
		containsText(value.root)
	) {
		return { data: value, language: locale };
	}
	return { data: original, language: DEFAULT_LOCALE };
}
