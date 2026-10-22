import { HELP_TOPICS, type HelpTopic } from "@/config/help";
import { editorialHelp } from "./editorial";
import { mediaHelp } from "./media";
import { publicationHelp } from "./publication";
import { settingsHelp } from "./settings";
import { troubleshootingHelp } from "./troubleshooting";
import type { HelpArticle } from "./types";

export const helpArticles: Readonly<Record<HelpTopic, HelpArticle>> = {
	[HELP_TOPICS.publication]: publicationHelp,
	...editorialHelp,
	[HELP_TOPICS.media]: mediaHelp,
	...settingsHelp,
	[HELP_TOPICS.troubleshooting]: troubleshootingHelp,
};
