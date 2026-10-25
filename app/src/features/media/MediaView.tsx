import { IMAGE_SIZES } from "@/config/image";
import { mediaURL } from "@/config/media";
import { MEDIA_DELIVERY } from "@/config/media-assets";
import { LOCALES } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { classes } from "@/lib/classes";
import styles from "./media.module.css";
import { ResponsiveImage } from "./ResponsiveImage";
import { isReadyImage, isReadyVideo, type MediaView } from "./view-model";

type ImageProps = {
	readonly asset: MediaView | null | undefined;
	readonly alt?: string;
	readonly priority?: boolean;
	readonly cover?: boolean;
	readonly className?: string;
	readonly sizes?: string;
};

export function MediaImage({
	asset,
	alt,
	priority,
	cover,
	className,
	sizes = IMAGE_SIZES.columns,
}: ImageProps) {
	if (!isReadyImage(asset)) {
		return null;
	}
	return (
		<ResponsiveImage
			id={asset.id}
			className={classes(styles.image, cover && styles.cover, className)}
			sizes={sizes}
			alt={alt ?? asset.alt ?? asset.title}
			width={asset.width}
			height={asset.height}
			priority={priority}
		/>
	);
}

export function MediaVideo({
	asset,
}: {
	readonly asset: MediaView | null | undefined;
}) {
	const { media: messages } = getMessages();
	if (!isReadyVideo(asset)) {
		return null;
	}
	return (
		<video
			className={styles.video}
			controls
			playsInline
			preload="none"
			poster={mediaURL(asset.id, MEDIA_DELIVERY.poster)}
			width={asset.width ?? undefined}
			height={asset.height ?? undefined}
			aria-label={asset.title}
		>
			<source src={mediaURL(asset.id, MEDIA_DELIVERY.video)} type="video/mp4" />
			<track
				kind="captions"
				src={
					asset.hasCaptions
						? mediaURL(asset.id, MEDIA_DELIVERY.captions)
						: undefined
				}
				srcLang={LOCALES.ru}
				label={messages.captions}
				default
			/>
			{messages.unsupportedVideo}
		</video>
	);
}
