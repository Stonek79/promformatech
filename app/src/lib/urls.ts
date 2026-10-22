import {
	PAGE_SLUGS,
	ROUTES,
	SHOWCASE_PATHS,
	type ShowcaseCollection,
} from "@/config/content";

const LAST_ASCII_WHITESPACE = 0x20;
const ASCII_DELETE = 0x7f;
const RESERVED_SLUGS = new Set([
	"admin",
	"api",
	"media",
	"preview",
	"search",
	"ui-kit",
]);

export function isSafeHref(value: unknown): value is string {
	if (
		typeof value !== "string" ||
		!value ||
		[...value].some(
			(character) =>
				character.charCodeAt(0) <= LAST_ASCII_WHITESPACE ||
				character.charCodeAt(0) === ASCII_DELETE ||
				character === "\\",
		)
	) {
		return false;
	}
	if (value.startsWith("/")) {
		return !value.startsWith("//");
	}
	try {
		return ["https:", "http:", "mailto:", "tel:"].includes(
			new URL(value).protocol,
		);
	} catch {
		return false;
	}
}

export function pagePath(slug: string) {
	return slug === PAGE_SLUGS.home ? ROUTES.home : `/${slug}`;
}

export function materialPath(collection: ShowcaseCollection, slug: string) {
	return `${SHOWCASE_PATHS[collection]}/${encodeURIComponent(slug)}`;
}

export function isValidSlug(slug: string) {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function phoneHref(phone: string) {
	return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function serverURL() {
	return process.env.SERVER_URL || "http://localhost:3000";
}

export function allowedOrigins() {
	const canonical = new URL(serverURL());
	const origins = [canonical.origin];
	if (
		process.env.NODE_ENV !== "production" &&
		["localhost", "127.0.0.1"].includes(canonical.hostname)
	) {
		for (const hostname of ["localhost", "127.0.0.1"]) {
			const url = new URL(canonical);
			url.hostname = hostname;
			origins.push(url.origin);
		}
	}
	return [...new Set(origins)];
}
