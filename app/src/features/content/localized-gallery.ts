import { mediaView } from "@/features/media/view-model";
import type { Locale } from "@/i18n/config";
import type { Product } from "@/payload-types";
import { localizedText, matchRows } from "./localized-fields";

type GalleryRows = Product["gallery"];

export function localizedGallery(
	locale: Locale,
	rows: GalleryRows,
	source?: GalleryRows,
) {
	return matchRows(rows, source, (row, original) => {
		const asset = mediaView(row.asset);
		const caption = localizedText(locale, row.caption, original?.caption);
		return asset
			? [{ asset, caption: caption.value, captionLanguage: caption.lang }]
			: [];
	}).flat();
}
