import { describe, expect, it } from "vitest";
import { parseByteRange } from "@/features/media/range";
import { collectMediaIDs, relationshipID } from "@/features/media/references";

describe("private media references", () => {
	it("does not publish files from hidden blocks", () => {
		expect(
			collectMediaIDs({
				blocks: [
					{ visible: false, image: 99 },
					{ visible: true, image: 1 },
				],
			}),
		).toEqual([1]);
	});
	it("collects explicit files and ignores linked materials and editor JSON", () => {
		expect(
			collectMediaIDs({
				logo: 1,
				blocks: [{ image: { id: 2 } }, { gallery: [{ asset: "3" }] }],
				items: [{ relationTo: "projects", value: { image: 99 } }],
				body: { image: 98 },
				referencedMedia: [97],
			}),
		).toEqual([1, 2, 3]);
	});
	it.each([0, -1, "../1", "1e3", Number.NaN, {}, null])(
		"rejects invalid ID %j",
		(value) => {
			expect(relationshipID(value)).toBeNull();
		},
	);
});

describe("video byte ranges", () => {
	it.each([
		["bytes=0-9", { start: 0, end: 9 }],
		["bytes=90-", { start: 90, end: 99 }],
		["bytes=-10", { start: 90, end: 99 }],
		["bytes=80-200", { start: 80, end: 99 }],
	])("parses %s", (header, result) => {
		expect(parseByteRange(String(header), 100)).toEqual(result);
	});
	it.each([
		"bytes=100-",
		"bytes=-0",
		"bytes=9-1",
		"bytes=0-1,3-4",
		"bad",
		"bytes=9007199254740993-",
	])("rejects %s", (header) =>
		expect(() => parseByteRange(header, 100)).toThrow(RangeError),
	);
});
