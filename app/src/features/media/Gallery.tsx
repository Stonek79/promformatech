"use client";

import Image from "next/image";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { IMAGE_SIZES } from "@/config/image";
import { MEDIA_STATUS, mediaURL } from "@/config/media";
import { MEDIA_DELIVERY, MEDIA_KIND } from "@/config/media-assets";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { MediaImage, MediaVideo } from "./MediaView";
import styles from "./media.module.css";
import { PhotoDialog } from "./PhotoDialog";
import type { MediaView } from "./view-model";

export type GalleryItem = {
	readonly asset: MediaView;
	readonly caption?: string | null;
	readonly captionLanguage?: Locale;
};

export function Gallery({
	items,
	staticPhotos,
}: {
	readonly items: readonly GalleryItem[];
	readonly staticPhotos?: boolean;
}) {
	const { media: messages } = useMessages();
	const locale = useLocale();
	return (
		<div className={styles.gallery}>
			{items
				.filter(({ asset }) => asset.processingStatus === MEDIA_STATUS.ready)
				.map(({ asset, caption, captionLanguage }) => (
					<figure key={asset.id} className={styles.figure}>
						{asset.kind === MEDIA_KIND.image && staticPhotos && (
							<MediaImage asset={asset} sizes={IMAGE_SIZES.card} />
						)}
						{asset.kind === MEDIA_KIND.image && !staticPhotos && (
							<PhotoDialog
								asset={asset}
								caption={caption || asset.caption}
								captionLanguage={captionLanguage}
								trigger={
									<button
										type="button"
										className={styles.thumbnail}
										aria-label={messages.open(asset.title)}
									>
										<MediaImage asset={asset} cover sizes={IMAGE_SIZES.card} />
									</button>
								}
							/>
						)}
						{asset.kind !== MEDIA_KIND.image && (
							<Dialog
								title={asset.title}
								titleLanguage={DEFAULT_LOCALE}
								trigger={
									<button
										type="button"
										className={styles.thumbnail}
										aria-label={messages.open(asset.title)}
									>
										<Image
											unoptimized
											fill
											className={styles.image}
											style={{ objectFit: "cover" }}
											src={mediaURL(asset.id, MEDIA_DELIVERY.poster)}
											alt={asset.alt || asset.title}
											loading="lazy"
										/>
										<span className={styles.play} aria-hidden="true">
											▶
										</span>
									</button>
								}
							>
								<MediaVideo asset={asset} locale={locale} />
								{(caption || asset.caption) && (
									<p lang={captionLanguage ?? DEFAULT_LOCALE}>
										{caption || asset.caption}
									</p>
								)}
							</Dialog>
						)}
						{(caption || asset.caption) && (
							<figcaption lang={captionLanguage ?? DEFAULT_LOCALE}>
								{caption || asset.caption}
							</figcaption>
						)}
					</figure>
				))}
		</div>
	);
}
