import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/config/content";
import { PREVIEW_TARGET_COOKIE } from "@/features/content/viewer";
import { parseLocale, SITE_LANGUAGE_QUERY } from "@/i18n/config";
import { sitePath } from "@/i18n/site-path";

export async function GET(request: Request) {
	(await draftMode()).disable();
	(await cookies()).delete(PREVIEW_TARGET_COOKIE);
	const language = new URL(request.url).searchParams.get(SITE_LANGUAGE_QUERY);
	redirect(sitePath(ROUTES.home, parseLocale(language)));
}
