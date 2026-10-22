import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
	InquiryValidationError,
	parseInquiry,
} from "@/features/leads/validation";

const inquiry = () => ({
	requestID: randomUUID(),
	name: "Иван",
	contact: "+7 (985) 306-98-66",
	message: "Нужна пресс-форма",
	sourcePath: "/",
	consent: true,
});
describe("inquiry validation", () => {
	it("accepts phone and email", () => {
		expect(parseInquiry(inquiry()).name).toBe("Иван");
		expect(
			parseInquiry({ ...inquiry(), contact: "person@example.test" }).contact,
		).toBe("person@example.test");
	});
	it.each([
		{ name: "" },
		{ contact: "invalid" },
		{ consent: false },
		{ requestID: "fake" },
		{ website: "spam" },
		{ message: "a".repeat(3001) },
		{ sourcePath: "//evil.test" },
	])("rejects malformed submission %j", (patch) => {
		expect(() => parseInquiry({ ...inquiry(), ...patch })).toThrow(
			InquiryValidationError,
		);
	});
});
