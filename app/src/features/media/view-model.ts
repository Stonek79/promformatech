import { MEDIA_KIND, MEDIA_STATUS } from "@/config/media";
import type { Media } from "@/payload-types";

export type MediaView = Readonly<
	Pick<
		Media,
		| "id"
		| "title"
		| "alt"
		| "caption"
		| "width"
		| "height"
		| "kind"
		| "processingStatus"
	> & { hasCaptions?: boolean }
>;

type ReadyImage = MediaView & {
	readonly kind: typeof MEDIA_KIND.image;
	readonly width: number;
	readonly height: number;
};

export function mediaView(
	value: number | Media | null | undefined,
): MediaView | null {
	if (!value) {
		return null;
	}
	if (typeof value === "number") {
		return null;
	}
	const { id, title, alt, caption, width, height, kind, processingStatus } =
		value;
	return {
		id,
		title,
		alt,
		caption,
		width,
		height,
		kind,
		processingStatus,
		hasCaptions: Boolean(value.hasCaptions),
	};
}

function isReadyMedia(asset: MediaView | null | undefined): asset is MediaView {
	return asset?.processingStatus === MEDIA_STATUS.ready;
}

export function isReadyImage(
	asset: MediaView | null | undefined,
): asset is ReadyImage {
	if (!isReadyMedia(asset)) {
		return false;
	}
	if (asset.kind !== MEDIA_KIND.image) {
		return false;
	}
	return Boolean(asset.width && asset.height);
}

export function isReadyVideo(
	asset: MediaView | null | undefined,
): asset is MediaView {
	if (!isReadyMedia(asset)) {
		return false;
	}
	return asset.kind === MEDIA_KIND.video;
}
