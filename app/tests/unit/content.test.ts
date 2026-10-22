import { describe, expect, it } from "vitest";
import { isStaff } from "@/cms/access";
import { resolveContentRoute } from "@/features/content/route";
import { slugify } from "@/lib/slug";
import { isSafeHref, isValidSlug } from "@/lib/urls";

describe("content boundaries", () => {
	it("supports section routes without HTML suffixes", () => {
		for (const slug of [
			"about",
			"products",
			"services",
			"projects",
			"contacts",
		]) {
			expect(isValidSlug(slug)).toBe(true);
		}
		expect(isValidSlug("contacts.html")).toBe(false);
	});
	it("does not transliterate Russian titles", () => {
		expect(slugify("Пресс-форма A-TRP")).toBe("");
		expect(slugify("Injection Mold A-TRP")).toBe("injection-mold-a-trp");
	});
	it.each([
		"javascript:alert(1)",
		"//evil.test",
		"/\\evil.test",
		"https:\n//evil.test",
		"data:text/html,hello",
	])("rejects dangerous link %s", (url) => expect(isSafeHref(url)).toBe(false));
	it.each([
		"/contacts",
		"/#contact",
		"https://example.test/page",
		"tel:+79853069866",
		"mailto:a@example.test",
	])("allows link %s", (url) => expect(isSafeHref(url)).toBe(true));
	it.each(["admin", "media", "api", "../etc", "bad/slug"])(
		"reserves %s",
		(slug) => expect(isValidSlug(slug)).toBe(false),
	);
	it("resolves only supported route shapes", () => {
		expect(resolveContentRoute(["products", "sample"])).toEqual({
			kind: "material",
			collection: "products",
			slug: "sample",
		});
		expect(resolveContentRoute(["anything", "sample"])).toBeNull();
		expect(resolveContentRoute(["products", "sample", "extra"])).toBeNull();
	});
	it("requires authenticated staff identity", () => {
		expect(isStaff({ id: 1, role: "manager" })).toBe(true);
		expect(isStaff({ role: "manager" })).toBe(false);
		expect(isStaff({ id: 1, role: "visitor" })).toBe(false);
	});
});
