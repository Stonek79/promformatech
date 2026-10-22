import { cookies, draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/config/content";
import { PREVIEW_TARGET_COOKIE } from "@/features/content/viewer";

export async function GET() {
	(await draftMode()).disable();
	(await cookies()).delete(PREVIEW_TARGET_COOKIE);
	redirect(ROUTES.home);
}
