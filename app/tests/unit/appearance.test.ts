import { describe, expect, it } from "vitest";
import {
	parseTextSize,
	parseTheme,
	TEXT_SIZES,
	THEMES,
} from "../../src/config/appearance";

describe("appearance preferences from untrusted cookies", () => {
	it.each([undefined, null, "", "invalid", {}, 1])(
		"uses safe defaults for %j",
		(value) => {
			expect(parseTheme(value)).toBe(THEMES.system);
			expect(parseTextSize(value)).toBe(TEXT_SIZES.standard);
		},
	);
	it("preserves supported explicit choices", () => {
		expect(parseTheme(THEMES.dark)).toBe(THEMES.dark);
		expect(parseTheme(THEMES.light)).toBe(THEMES.light);
		expect(parseTextSize(TEXT_SIZES.large)).toBe(TEXT_SIZES.large);
		expect(parseTextSize(TEXT_SIZES.larger)).toBe(TEXT_SIZES.larger);
	});
});
