import type { ImageLoaderProps } from "next/image";
import { IMAGE_QUERY } from "@/config/image";
import { IMAGE_WIDTHS, MEDIA_DELIVERY, mediaURL } from "@/config/media";

export function derivativeURL(id: number, width: ImageLoaderProps["width"]) {
	const variant =
		width <= IMAGE_WIDTHS.small
			? MEDIA_DELIVERY.small
			: width <= IMAGE_WIDTHS.medium
				? MEDIA_DELIVERY.medium
				: MEDIA_DELIVERY.image;
	return `${mediaURL(id, variant)}?${IMAGE_QUERY.width}=${width}`;
}
