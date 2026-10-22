import { COLLECTIONS, GLOBALS, ROUTES } from "./content";

export const ADMIN_HELP = {
	path: "/help",
	title: "Помощь менеджеру",
	contentsID: "help-contents",
} as const;

export const HELP_TOPICS = {
	publication: "publication",
	pages: COLLECTIONS.pages,
	products: COLLECTIONS.products,
	services: COLLECTIONS.services,
	projects: COLLECTIONS.projects,
	media: COLLECTIONS.media,
	site: GLOBALS.site,
	leads: COLLECTIONS.leads,
	users: COLLECTIONS.users,
	service: GLOBALS.service,
	troubleshooting: "troubleshooting",
} as const;

export type HelpTopic = (typeof HELP_TOPICS)[keyof typeof HELP_TOPICS];

export const HELP_DISPLAY_UNITS = {
	bytesPerMiB: 1_048_576,
	secondsPerMinute: 60,
} as const;

export function adminHelpURL(topic?: HelpTopic) {
	const path = `${ROUTES.admin}${ADMIN_HELP.path}`;
	return topic ? `${path}#${topic}` : path;
}
