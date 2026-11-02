import type { Access, FieldHook, Where } from "payload";
import { PAGE_SLUGS } from "@/config/content";
import { isPublicHref } from "@/lib/urls";
import { publishedOrStaff } from "../access";

export const ACTIVE_PAGES = {
	slug: { not_equals: PAGE_SLUGS.privacy },
} satisfies Where;

export const readablePages: Access = async (args) => {
	const access = await publishedOrStaff(args);
	if (typeof access === "boolean") {
		return access ? ACTIVE_PAGES : false;
	}
	return { and: [ACTIVE_PAGES, access] };
};

export const omitPolicyLinks: FieldHook = ({ value }: { value?: unknown }) => {
	if (!Array.isArray(value)) {
		return value;
	}
	return value.filter((link: unknown) => {
		if (typeof link !== "object" || link === null || !("url" in link)) {
			return false;
		}
		return isPublicHref(link.url);
	});
};
