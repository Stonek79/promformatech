import { Heading, Section } from "@/components/ui/Layout/Layout";
import { COLLECTIONS, type ShowcaseCollection } from "@/config/content";
import { Gallery } from "@/features/media/Gallery";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { classes } from "@/lib/classes";
import type { SiteSetting } from "@/payload-types";
import { ContentBlocks } from "./Blocks";
import type { ShowcaseMaterial } from "./MaterialCards";
import styles from "./pages.module.css";
import specificationStyles from "./specifications.module.css";

type Props = {
	readonly material: ShowcaseMaterial;
	readonly collection: ShowcaseCollection;
	readonly settings: SiteSetting;
	readonly preview: boolean;
};

export function MaterialView({
	material,
	collection,
	settings,
	preview,
}: Props) {
	return (
		<article>
			<header className={styles.pageHeader}>
				<Heading as="h1">{material.title}</Heading>
			</header>
			<Section className={styles.introduction}>
				<MediaImage asset={mediaView(material.featuredImage)} priority />
				<p>{material.summary}</p>
			</Section>
			{collection === COLLECTIONS.projects && "task" in material && (
				<Section className={styles.case}>
					{material.task && (
						<div>
							<Heading>{settings.labels?.task}</Heading>
							<p>{material.task}</p>
						</div>
					)}
					{material.solution && (
						<div>
							<Heading>{settings.labels?.solution}</Heading>
							<p>{material.solution}</p>
						</div>
					)}
					{material.result && (
						<div>
							<Heading>{settings.labels?.result}</Heading>
							<p>{material.result}</p>
						</div>
					)}
				</Section>
			)}
			{collection === COLLECTIONS.products &&
				"specifications" in material &&
				!!material.specifications?.length && (
					<Section>
						<Heading>{settings.labels?.specifications}</Heading>
						<dl
							className={classes(
								styles.specifications,
								specificationStyles.list,
							)}
						>
							{material.specifications.map((item) => (
								<div key={item.id}>
									<dt>{item.label}</dt>
									<dd>{item.value}</dd>
								</div>
							))}
						</dl>
					</Section>
				)}
			{!!material.gallery?.length && (
				<Section>
					<Heading>{settings.labels?.gallery}</Heading>
					<Gallery
						items={material.gallery.flatMap((item) => {
							const asset = mediaView(item.asset);
							return asset ? [{ asset, caption: item.caption }] : [];
						})}
					/>
				</Section>
			)}
			<ContentBlocks
				blocks={material.blocks}
				form={settings.form}
				preview={preview}
			/>
		</article>
	);
}
