import { cookies } from "next/headers";
import { APPEARANCE, parseTextSize } from "@/config/appearance";
import { AdminAppearance } from "./AdminAppearance";

export async function AppearanceAction() {
	const size = parseTextSize(
		(await cookies()).get(APPEARANCE.adminSizeCookie)?.value,
	);
	return <AdminAppearance initialSize={size} />;
}
