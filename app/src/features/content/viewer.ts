import { cookies, draftMode, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isStaff } from "@/cms/access";
import { getCMS } from "@/cms/client";
import { adminCollectionURL, adminGlobalURL } from "@/config/cms";
import {
	COLLECTIONS,
	GLOBALS,
	ROUTES,
	SHOWCASE_COLLECTIONS,
} from "@/config/content";

export const PREVIEW_TARGET_COOKIE = "pf-preview-target";

export function editURL(target: unknown) {
	if (!target || typeof target !== "object") {
		return ROUTES.admin;
	}
	const value = target as Record<string, unknown>;
	if (value.global === GLOBALS.site) {
		return adminGlobalURL(GLOBALS.site);
	}
	if (
		[COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS].some(
			(slug) => slug === value.collection,
		) &&
		/^[1-9]\d*$/.test(String(value.id))
	) {
		return adminCollectionURL(String(value.collection), String(value.id));
	}
	return ROUTES.admin;
}

export const getViewer = cache(async () => {
	const mode = await draftMode();
	if (!mode.isEnabled) {
		return { preview: false as const, user: null, editURL: ROUTES.admin };
	}
	const { user } = await (await getCMS()).auth({ headers: await headers() });
	if (!isStaff(user)) {
		redirect(ROUTES.exitPreview);
	}
	let target = {};
	try {
		target = JSON.parse(
			decodeURIComponent(
				(await cookies()).get(PREVIEW_TARGET_COOKIE)?.value || "%7B%7D",
			),
		);
	} catch {
		/* A malformed target never changes permissions. */
	}
	return { preview: true as const, user, editURL: editURL(target) };
});

export type Viewer = Awaited<ReturnType<typeof getViewer>>;
