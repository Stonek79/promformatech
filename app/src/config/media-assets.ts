export const MEDIA_KIND = { image: "image", video: "video" } as const;
export type MediaKind = (typeof MEDIA_KIND)[keyof typeof MEDIA_KIND];
export const IMAGE_WIDTHS = { small: 480, medium: 960, large: 1600 } as const;
export const MEDIA_DELIVERY = {
	image: "image",
	small: "small",
	medium: "medium",
	poster: "poster",
	video: "video",
	original: "original",
	captions: "captions",
} as const;
export const MEDIA_VARIANTS = {
	image: { file: "image.webp", mime: "image/webp" },
	small: { file: `image-${IMAGE_WIDTHS.small}.webp`, mime: "image/webp" },
	medium: { file: `image-${IMAGE_WIDTHS.medium}.webp`, mime: "image/webp" },
	poster: { file: "poster.jpg", mime: "image/jpeg" },
	video: { file: "video.mp4", mime: "video/mp4" },
} as const;
export type MediaVariant = keyof typeof MEDIA_VARIANTS;
