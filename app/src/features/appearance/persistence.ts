import { APPEARANCE, type TextSize } from "@/config/appearance";

export function savePreference(name: string, value: string) {
	const secure = window.location.protocol === "https:" ? "; Secure" : "";
	// biome-ignore lint/suspicious/noDocumentCookie: non-sensitive preferences need SSR cookies, including browsers without Cookie Store support.
	document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${APPEARANCE.cookieMaxAge}; SameSite=Lax${secure}`;
}

export function applyTextSize(size: TextSize, cookie: string) {
	document.documentElement.setAttribute(APPEARANCE.sizeAttribute, size);
	savePreference(cookie, size);
}
