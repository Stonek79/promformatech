import { ROUTES } from "./content";

export const CMS_PATHS = {
	collections: `${ROUTES.admin}/collections`,
	globals: `${ROUTES.admin}/globals`,
	login: `${ROUTES.admin}/login`,
} as const;

export const CMS_ACTIONS = {
	create: "create",
	retryMedia: "retry",
	retryNotification: "notify",
} as const;

export function adminCollectionURL(collection: string, id?: number | string) {
	const root = `${CMS_PATHS.collections}/${collection}`;
	return id === undefined ? root : `${root}/${encodeURIComponent(String(id))}`;
}

export function adminGlobalURL(global: string) {
	return `${CMS_PATHS.globals}/${global}`;
}

export function collectionAPIURL(
	collection: string,
	id?: number | string,
	action?: string,
) {
	const root = `${ROUTES.api}/${collection}`;
	const document =
		id === undefined ? root : `${root}/${encodeURIComponent(String(id))}`;
	return action ? `${document}/${action}` : document;
}
