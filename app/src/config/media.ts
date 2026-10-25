import { ROUTES } from "./content";
import {
	IMAGE_WIDTHS,
	type MEDIA_DELIVERY,
	type MediaVariant,
} from "./media-assets";
export const MEDIA_FIELDS = {
	image: "image",
	featuredImage: "featuredImage",
	asset: "asset",
	video: "video",
	logo: "logo",
	footerLogo: "footerLogo",
	cover: "cover",
} as const;
export const MEDIA_REFERENCE_FIELDS = {
	relationTo: "relationTo",
	value: "value",
	referencedMedia: "referencedMedia",
	body: "body",
} as const;

export const MEDIA_SOURCE = {
	buffer: "buffer",
	temporary: "temporary",
} as const;
export const MEDIA_UPLOAD = {
	files: 1,
	fields: 4,
	fieldBytes: 262_144,
	fieldNameBytes: 100,
	boundaryBytes: 65_536,
	idleTimeoutMilliseconds: 60_000,
	orphanGraceMilliseconds: 3_600_000,
	reconcileIntervalMilliseconds: 60_000,
	reconcileLimit: 100,
} as const;

export const MEDIA_STATUS = {
	queued: "queued",
	processing: "processing",
	ready: "ready",
	error: "error",
} as const;

export const MEDIA_POLICY = {
	maxFileBytes: 524_288_000,
	maxImagePixels: 40_000_000,
	maxVideoSeconds: 900,
	processTimeoutMilliseconds: 1_200_000,
	probeTimeoutMilliseconds: 30_000,
	imageWidths: [IMAGE_WIDTHS.small, IMAGE_WIDTHS.medium, IMAGE_WIDTHS.large],
	webpQuality: 86,
	videoWidth: 1920,
	videoHeight: 1080,
	videoCrf: 22,
	posterWidth: 960,
	encoderThreads: 1,
	workerPollMilliseconds: 3000,
	workerConcurrency: 1,
} as const;

export const MEDIA_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/avif",
	"video/mp4",
	"video/quicktime",
	"video/webm",
] as const;

export function mediaURL(
	id: number | string,
	variant:
		| MediaVariant
		| typeof MEDIA_DELIVERY.original
		| typeof MEDIA_DELIVERY.captions,
	options: { readonly draft?: boolean } = {},
) {
	const path = `${ROUTES.media}/${encodeURIComponent(String(id))}/${variant}`;
	return options.draft ? `${path}?draft=true` : path;
}
