import type { FieldHook } from "payload";
import { describe, expect, it } from "vitest";
import {
	ACTIVE_PAGES,
	omitPolicyLinks,
	readablePages,
} from "@/cms/hooks/retired-content";
import { PAGE_SLUGS, PUBLICATION, ROLES, ROUTES } from "@/config/content";
import { resolveContentRoute } from "@/features/content/route";
import { isPublicHref, isValidSlug, serverURL } from "@/lib/urls";

function fieldValue(hook: FieldHook, value: unknown) {
	return Reflect.apply(hook, undefined, [{ value }]);
}

describe("retired feedback content in existing CMS data", () => {
	it.each([ROLES.owner, ROLES.manager])(
		"hides the retired page from %s",
		async (role) => {
			const result = await Reflect.apply(readablePages, undefined, [
				{ req: { user: { id: 1, role } } },
			]);
			expect(result).toEqual(ACTIVE_PAGES);
		},
	);

	it("also enforces publication when a visitor queries pages", async () => {
		const result = await Reflect.apply(readablePages, undefined, [{ req: {} }]);
		expect(result).toEqual({
			and: [ACTIVE_PAGES, { _status: { equals: PUBLICATION.published } }],
		});
	});

	it("does not resolve the retired route or accept it as a new slug", () => {
		expect(resolveContentRoute([PAGE_SLUGS.privacy])).toBeNull();
		expect(isValidSlug(PAGE_SLUGS.privacy)).toBe(false);
	});

	it.each([
		ROUTES.privacy,
		`${ROUTES.privacy}/`,
		`${ROUTES.privacy}?from=footer`,
		`${ROUTES.privacy}#consent`,
		new URL(ROUTES.privacy, serverURL()).href,
	])("does not offer a link to the removed page: %s", (url) => {
		expect(isPublicHref(url)).toBe(false);
	});

	it("keeps contact links and unrelated external pages", async () => {
		const links = [
			{ label: "Политика", url: ROUTES.privacy },
			{ label: "Контакты", url: ROUTES.contact },
			{ label: "Внешний документ", url: "https://example.test/privacy" },
		];
		expect(await fieldValue(omitPolicyLinks, links)).toEqual(links.slice(1));
	});
});
