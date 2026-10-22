import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, parseLocale } from "../../src/i18n/config";

describe("locale selection", () => {
	it.each([undefined, null, {}, "__proto__", "not-a-locale"])(
		"falls back safely for unsupported locale %j",
		(value) => {
			expect(parseLocale(value)).toBe(DEFAULT_LOCALE);
		},
	);
});
