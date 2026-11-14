import Link from "next/link";
import { COLLECTIONS, type ShowcaseCollection } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { classes } from "@/lib/classes";
import { materialPath } from "@/lib/urls";
import type { Product, Project, Service } from "@/payload-types";
import styles from "./content.module.css";

const MAX_PRODUCT_COLUMNS = 4;

export type ShowcaseMaterial = Product | Service | Project;
type Card = {
	readonly collection: ShowcaseCollection;
	readonly material: ShowcaseMaterial;
};

export function MaterialCards({
	items,
	compact = false,
}: {
	readonly items: readonly Card[];
	readonly compact?: boolean;
}) {
	const Title = compact ? "h2" : "h3";
	return (
		<div className={classes(styles.cards, compact && styles.productCards)}>
			{items.map(({ collection, material }, index) => (
				<Link
					key={`${collection}-${material.id}`}
					href={materialPath(collection, material.slug)}
					className={classes(
						styles.card,
						collection === COLLECTIONS.services && styles.serviceCard,
					)}
				>
					<div className={styles.cardImage}>
						<MediaImage
							sizes={compact ? IMAGE_SIZES.productCard : IMAGE_SIZES.card}
							asset={mediaView(material.featuredImage)}
							cover={collection !== COLLECTIONS.services}
							priority={compact && index === 0}
							eager={compact && index < MAX_PRODUCT_COLUMNS}
						/>
					</div>
					<div className={styles.cardBody}>
						<Title>{material.title}</Title>
						{collection !== COLLECTIONS.services && <p>{material.summary}</p>}
					</div>
				</Link>
			))}
		</div>
	);
}
