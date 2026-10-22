"use client";

import Image from "next/image";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { IMAGE_SIZES } from "@/config/image";
import {
	MEDIA_DELIVERY,
	MEDIA_KIND,
	MEDIA_STATUS,
	mediaURL,
} from "@/config/media";
import { useMessages } from "@/i18n/MessagesProvider";
import { MediaImage, MediaVideo } from "./MediaView";
import styles from "./media.module.css";
import type { MediaView } from "./view-model";

export type GalleryItem = {
	readonly asset: MediaView;
	readonly caption?: string | null;
};

export function Gallery({ items }: { readonly items: readonly GalleryItem[] }) {
	const { media: messages } = useMessages();
	const [selected, setSelected] = useState<number | null>(null);
	return (
		<div className={styles.gallery}>
			{items
				.filter(({ asset }) => asset.processingStatus === MEDIA_STATUS.ready)
				.map(({ asset, caption }) => (
					<figure key={asset.id} className={styles.figure}>
						<Dialog
							title={asset.title}
							open={selected === asset.id}
							onOpenChange={(open) => setSelected(open ? asset.id : null)}
							trigger={
								<button
									type="button"
									className={styles.thumbnail}
									aria-label={messages.open(asset.title)}
								>
									{asset.kind === MEDIA_KIND.image ? (
										<MediaImage asset={asset} cover sizes={IMAGE_SIZES.card} />
									) : (
										<>
											<Image
												unoptimized
												fill
												className={`${styles.image} ${styles.cover}`}
												src={mediaURL(asset.id, MEDIA_DELIVERY.poster)}
												alt={asset.alt || asset.title}
												loading="lazy"
											/>
											<span className={styles.play}>▶</span>
										</>
									)}
								</button>
							}
						>
							{asset.kind === MEDIA_KIND.image ? (
								<MediaImage asset={asset} sizes={IMAGE_SIZES.full} />
							) : (
								<MediaVideo asset={asset} />
							)}
							{(caption || asset.caption) && <p>{caption || asset.caption}</p>}
						</Dialog>
						{(caption || asset.caption) && (
							<figcaption>{caption || asset.caption}</figcaption>
						)}
					</figure>
				))}
		</div>
	);
}
