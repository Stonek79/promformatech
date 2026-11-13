import { MEDIA_TITLE } from "@/config/media";
import { getMessages } from "@/i18n/messages";

export function mediaTitleFromFilename(filename: unknown, date = new Date()) {
	if (typeof filename === "string") {
		const name = filename.split(/[/\\]/).at(-1) || "";
		const title = name
			.replace(/\.[^.\s]+$/u, "")
			.replace(/[_\s]+/gu, " ")
			.trim();
		if (title && /[\p{L}\p{N}]/u.test(title)) {
			return Array.from(title).slice(0, MEDIA_TITLE.maximumCharacters).join("");
		}
	}
	const timestamp = date
		.toISOString()
		.replace("T", " ")
		.replace(/\.\d+Z$/, " UTC");
	return getMessages().cms.mediaNaming.fallback(timestamp);
}
