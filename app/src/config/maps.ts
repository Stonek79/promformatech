const ADDRESS_SEARCH_URL = "https://yandex.ru/maps/";
const HTTPS_PROTOCOL = "https:";
export const MAP_ATTRIBUTION_URL = "https://www.openstreetmap.org/copyright";
export const MAP_ATTRIBUTION_LABEL = "© OpenStreetMap";
const MAP_PREVIEW_PATH = /^\/maps\/[a-z0-9-]+\.webp$/;

export const CONTACT_MAP_POSITION = {
	beside: "beside",
	address: "address",
	bottom: "bottom",
} as const;

export function isMapPreviewPath(value: unknown): value is string {
	return typeof value === "string" && MAP_PREVIEW_PATH.test(value);
}

export function addressSearchURL(address: string) {
	const url = new URL(ADDRESS_SEARCH_URL);
	url.searchParams.set("text", address.trim());
	return url.href;
}

export function isMapLink(value: unknown): value is string {
	if (typeof value !== "string" || !URL.canParse(value)) {
		return false;
	}
	const url = new URL(value);
	return url.protocol === HTTPS_PROTOCOL && !url.username && !url.password;
}
