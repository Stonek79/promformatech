import Link from "next/link";
import type { ShowcaseCollection } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { classes } from "@/lib/classes";
import { materialPath } from "@/lib/urls";
import type { Product, Project, Service } from "@/payload-types";
import styles from "./content.module.css";

export type ShowcaseMaterial = Product | Service | Project;
type Card = {
	readonly collection: ShowcaseCollection;
	readonly material: ShowcaseMaterial;
};

export function MaterialCards({ items }: { readonly items: readonly Card[] }) {
	return (
		<div className={styles.cards}>
			{items.map(({ collection, material }) => (
				<Link
					key={`${collection}-${material.id}`}
					href={materialPath(collection, material.slug)}
					className={classes(
						styles.card,
						collection === "services" && styles.serviceCard,
					)}
				>
					<div className={styles.cardImage}>
						<MediaImage
							sizes={IMAGE_SIZES.card}
							asset={mediaView(material.featuredImage)}
							cover={collection !== "services"}
						/>
					</div>
					<div className={styles.cardBody}>
						<h3>{material.title}</h3>
						{collection !== "services" && <p>{material.summary}</p>}
					</div>
				</Link>
			))}
		</div>
	);
}
