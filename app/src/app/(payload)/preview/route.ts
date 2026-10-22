import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { isStaff } from "@/cms/access";
import { getCMS } from "@/cms/client";
import {
	AUTH,
	COLLECTIONS,
	GLOBALS,
	ROUTES,
	SHOWCASE_COLLECTIONS,
} from "@/config/content";
import { HTTP } from "@/config/forms";
import { PREVIEW_TARGET_COOKIE } from "@/features/content/viewer";
import { materialPath, pagePath } from "@/lib/urls";

export async function GET(request: Request) {
	const cms = await getCMS();
	const { user } = await cms.auth({ headers: request.headers });
	if (!isStaff(user)) {
		redirect(`${ROUTES.admin}/login`);
	}
	const parameters = new URL(request.url).searchParams;
	const collection = parameters.get("collection");
	const id = Number(parameters.get("id"));
	const global = parameters.get("global");
	let destination: string;
	if (global === GLOBALS.site) {
		destination = ROUTES.home;
	} else if (
		collection &&
		[COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS].some(
			(slug) => slug === collection,
		) &&
		Number.isSafeInteger(id) &&
		id > 0
	) {
		const typedCollection = collection as
			| typeof COLLECTIONS.pages
			| (typeof SHOWCASE_COLLECTIONS)[number];
		const doc = await cms.findByID({
			collection: typedCollection,
			id,
			draft: true,
			overrideAccess: false,
			user,
		});
		destination =
			typedCollection === COLLECTIONS.pages
				? pagePath(doc.slug)
				: materialPath(typedCollection, doc.slug);
	} else {
		return new Response("Сохраните черновик перед предпросмотром.", {
			status: HTTP.badRequest,
		});
	}
	(await draftMode()).enable();
	(await cookies()).set(
		PREVIEW_TARGET_COOKIE,
		encodeURIComponent(JSON.stringify({ collection, id, global })),
		{
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: AUTH.sessionSeconds,
		},
	);
	redirect(destination);
}
