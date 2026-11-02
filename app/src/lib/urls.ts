import {
	PAGE_SLUGS,
	ROUTES,
	SHOWCASE_PATHS,
	type ShowcaseCollection,
} from "@/config/content";
import {
	getServerURL,
	isBuildPhase,
	RUNTIME,
	type RuntimeEnvironment,
} from "@/config/runtime";
import { LOCAL_HTTP_AUTH } from "@/config/security";

const LAST_ASCII_WHITESPACE = 0x20;
const ASCII_DELETE = 0x7f;
const RESERVED_SLUGS = new Set([
	"admin",
	"api",
	"media",
	"preview",
	"search",
	"ui-kit",
	PAGE_SLUGS.privacy,
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

export function isPublicHref(value: unknown): value is string {
	if (!isSafeHref(value)) {
		return false;
	}
	const origin = serverURL();
	const target = new URL(value, origin);
	if (target.origin !== origin) {
		return true;
	}
	return target.pathname.replace(/\/+$/, "") !== ROUTES.privacy;
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
	return getServerURL();
}

export function allowedOrigins(environment: RuntimeEnvironment = process.env) {
	const canonical = new URL(getServerURL(environment));
	const origins = [canonical.origin];
	if (
		environment.NODE_ENV !== RUNTIME.production &&
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

function isLocalHost(hostname: string) {
	return (
		LOCAL_HTTP_AUTH.loopbackNames.some((name) => name === hostname) ||
		LOCAL_HTTP_AUTH.privateIPv4.test(hostname)
	);
}

export function localHttpAuthEnabled(
	environment: RuntimeEnvironment = process.env,
) {
	if (
		environment.LOCAL_HTTP_AUTH !== LOCAL_HTTP_AUTH.enabled ||
		isBuildPhase(environment)
	) {
		return false;
	}
	const url = new URL(getServerURL(environment));
	if (
		environment.NODE_ENV === RUNTIME.production ||
		url.protocol !== LOCAL_HTTP_AUTH.protocol ||
		!isLocalHost(url.hostname)
	) {
		throw new Error(LOCAL_HTTP_AUTH.invalidConfiguration);
	}
	return true;
}
