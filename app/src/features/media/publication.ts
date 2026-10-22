import type { Media } from "@/payload-types";

export function processingSnapshot(media: Media) {
	return {
		kind: media.kind,
		processingStatus: media.processingStatus,
		storageKey: media.storageKey,
		derivativeKey: media.derivativeKey,
		width: media.width,
		height: media.height,
		duration: media.duration,
		optimizedBytes: media.optimizedBytes,
		filename: media.filename,
		mimeType: media.mimeType,
		filesize: media.filesize,
	};
}

export function mediaPublicationSnapshot(media: Media) {
	return {
		...processingSnapshot(media),
		title: media.title,
		alt: media.alt,
		caption: media.caption,
		captionTrack: media.captionTrack,
		hasCaptions: media.hasCaptions,
		archived: media.archived,
		error: media.error,
	};
}
