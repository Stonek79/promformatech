const LAST_ASCII_CHARACTER = 0x7f;

export function slugify(title: string) {
	if (
		[...title].some(
			(character) => character.charCodeAt(0) > LAST_ASCII_CHARACTER,
		)
	) {
		return "";
	}
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
