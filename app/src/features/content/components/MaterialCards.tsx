import Link from "next/link";
import { COLLECTIONS } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/site-path";
import { classes } from "@/lib/classes";
import { materialPath } from "@/lib/urls";
import type { MaterialCard } from "../material-locales";
import styles from "./content.module.css";

const MAX_PRODUCT_COLUMNS = 4;

export function MaterialCards({
	items,
	compact = false,
	locale,
}: {
	readonly items: readonly MaterialCard[];
	readonly compact?: boolean;
	readonly locale: Locale;
}) {
	const Title = compact ? "h2" : "h3";
	return (
		<div className={classes(styles.cards, compact && styles.productCards)}>
			{items.map((material, index) => (
				<Link
					key={`${material.collection}-${material.id}`}
					href={sitePath(
						materialPath(material.collection, material.slug),
						locale,
					)}
					className={classes(
						styles.card,
						material.collection === COLLECTIONS.services && styles.serviceCard,
					)}
				>
					<div className={styles.cardImage}>
						<MediaImage
							sizes={compact ? IMAGE_SIZES.productCard : IMAGE_SIZES.card}
							asset={mediaView(material.featuredImage)}
							cover={material.collection !== COLLECTIONS.services}
							priority={compact && index === 0}
							eager={compact && index < MAX_PRODUCT_COLUMNS}
						/>
					</div>
					<div className={styles.cardBody}>
						<Title lang={material.title.lang}>{material.title.value}</Title>
						{material.collection !== COLLECTIONS.services && (
							<p lang={material.summary.lang}>{material.summary.value}</p>
						)}
					</div>
				</Link>
			))}
		</div>
	);
}
