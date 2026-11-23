import Link from "next/link";
import { COLLECTIONS } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { FavoriteToggle } from "@/features/favorites/FavoriteToggle";
import { MediaImage } from "@/features/media/MediaView";
import { isReadyImage, mediaView } from "@/features/media/view-model";
import type { Locale } from "@/i18n/config";
import { sitePath } from "@/i18n/site-path";
import { classes } from "@/lib/classes";
import { materialPath } from "@/lib/urls";
import type { MaterialCard } from "../material-locales";
import styles from "./content.module.css";

const MAX_PRODUCT_COLUMNS = 4;
const MAX_STANDARD_COLUMNS = 3;

export function MaterialCards({
	items,
	compact = false,
	prioritizeFirstRow = false,
	headingLevel = "h3",
	locale,
}: {
	readonly items: readonly MaterialCard[];
	readonly compact?: boolean;
	readonly prioritizeFirstRow?: boolean;
	readonly headingLevel?: "h2" | "h3";
	readonly locale: Locale;
}) {
	const Title = headingLevel;
	const columns = compact ? MAX_PRODUCT_COLUMNS : MAX_STANDARD_COLUMNS;
	return (
		<div className={classes(styles.cards, compact && styles.productCards)}>
			{items.map((material, index) => {
				const key = `${material.collection}-${material.id}`;
				const href = sitePath(
					materialPath(material.collection, material.slug),
					locale,
				);
				const service = material.collection === COLLECTIONS.services;
				const asset = mediaView(material.featuredImage);
				const image = (!service || isReadyImage(asset)) && (
					<div className={styles.cardImage}>
						<MediaImage
							sizes={compact ? IMAGE_SIZES.productCard : IMAGE_SIZES.card}
							asset={asset}
							alt={service ? "" : undefined}
							cover
							priority={prioritizeFirstRow && index === 0}
							eager={prioritizeFirstRow && index < columns}
						/>
					</div>
				);
				const summary = (
					<p lang={material.summary.lang}>{material.summary.value}</p>
				);
				if (service) {
					return (
						<article
							key={key}
							className={classes(styles.card, styles.serviceCard)}
						>
							{image}
							<div className={styles.cardBody}>
								<Title lang={material.title.lang}>
									<Link data-return-card href={href}>
										{material.title.value}
									</Link>
								</Title>
								{material.summary.value && summary}
							</div>
						</article>
					);
				}
				const link = (
					<Link key={key} data-return-card href={href} className={styles.card}>
						{image}
						<div className={styles.cardBody}>
							<Title lang={material.title.lang}>{material.title.value}</Title>
							{summary}
						</div>
					</Link>
				);
				if (material.collection !== COLLECTIONS.products) {
					return link;
				}
				return (
					<article key={key} className={styles.favoriteCard}>
						{link}
						<FavoriteToggle
							id={material.id}
							title={material.title.value ?? material.slug}
							position="card"
						/>
					</article>
				);
			})}
		</div>
	);
}
