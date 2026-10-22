import { ROUTES } from "./content";

export const MEDIA_KIND = { image: "image", video: "video" } as const;
export type MediaKind = (typeof MEDIA_KIND)[keyof typeof MEDIA_KIND];
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
export const MEDIA_DELIVERY = {
	image: "image",
	small: "small",
	medium: "medium",
	poster: "poster",
	video: "video",
	original: "original",
	captions: "captions",
} as const;

export const MEDIA_STORAGE = {
	defaultRoot: "private/media",
	originals: "originals",
	derived: "derived",
	staging: "staging",
	fileMode: 0o600,
} as const;

export const MEDIA_STATUS = {
	queued: "queued",
	processing: "processing",
	ready: "ready",
	error: "error",
} as const;

export const IMAGE_WIDTHS = { small: 480, medium: 960, large: 1600 } as const;

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

export const MEDIA_VARIANTS = {
	image: { file: "image.webp", mime: "image/webp" },
	small: {
		file: `image-${MEDIA_POLICY.imageWidths[0]}.webp`,
		mime: "image/webp",
	},
	medium: {
		file: `image-${MEDIA_POLICY.imageWidths[1]}.webp`,
		mime: "image/webp",
	},
	poster: { file: "poster.jpg", mime: "image/jpeg" },
	video: { file: "video.mp4", mime: "video/mp4" },
} as const;
export type MediaVariant = keyof typeof MEDIA_VARIANTS;

export { JOBS } from "./jobs";

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
