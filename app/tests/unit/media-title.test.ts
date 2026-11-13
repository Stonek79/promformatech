import { describe, expect, it } from "vitest";
import { mediaTitleFromFilename } from "@/features/media/title";

describe("media titles from filenames", () => {
	it.each([
		["Пресс_форма.jpg", "Пресс форма"],
		["drawing.v2.png", "drawing.v2"],
		["C:\\uploads\\pump_video.MP4", "pump video"],
	])("cleans %s", (filename, expected) => {
		expect(mediaTitleFromFilename(filename)).toBe(expected);
	});
	it.each([".jpg", "___", "", undefined])(
		"uses a dated name when the filename is empty: %s",
		(filename) => {
			expect(
				mediaTitleFromFilename(filename, new Date("2026-11-13T12:34:56.000Z")),
			).toBe("Файл от 2026-11-13 12:34:56 UTC");
		},
	);
	it("limits long names without splitting a unicode character", () => {
		expect(
			Array.from(mediaTitleFromFilename(`${"a".repeat(179)}😀abc.jpg`)),
		).toHaveLength(180);
	});
});
