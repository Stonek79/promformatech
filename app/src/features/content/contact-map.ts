import {
	addressSearchURL,
	CONTACT_MAP_POSITION,
	isMapLink,
	isMapPreviewPath,
} from "@/config/maps";
import type { ContactLocation } from "@/features/content/site-settings";
import { isReadyImage, mediaView } from "@/features/media/view-model";

export function contactMap(location: ContactLocation) {
	const address = location.address?.trim();
	const settings = location.map;
	if (!address || settings?.visible === false) {
		return null;
	}
	const asset = mediaView(settings?.mapPreview);
	const url = settings?.url;
	const existing = settings?.existingPreview;
	return {
		address,
		href: isMapLink(url)
			? url
			: addressSearchURL(location.searchAddress || address),
		position: settings?.position ?? CONTACT_MAP_POSITION.beside,
		preview: isReadyImage(asset)
			? asset
			: isMapPreviewPath(existing)
				? existing
				: undefined,
	};
}
