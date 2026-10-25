import { ContactSection } from "@/components/site/ContactSection/ContactSection";
import { ButtonLink } from "@/components/ui/Button/Button";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { BLOCK_TYPES } from "@/config/blocks";
import { PUBLICATION, type ShowcaseCollection } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { Gallery } from "@/features/media/Gallery";
import { MediaImage, MediaVideo } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { classes } from "@/lib/classes";
import { isSafeHref } from "@/lib/urls";
import type { Page, SiteSetting } from "@/payload-types";
import styles from "./content.module.css";
import { MaterialCards } from "./MaterialCards";
import { RichText } from "./RichText";
import specificationStyles from "./specifications.module.css";

type Blocks = NonNullable<Page["blocks"]>;
type Props = {
	readonly blocks: Blocks | null | undefined;
	readonly preview: boolean;
	readonly home?: boolean;
	readonly form: SiteSetting["form"];
};

export function ContentBlocks({ blocks, preview, home, form }: Props) {
	return blocks
		?.filter((block) => block.visible !== false)
		.map((block, index) => {
			if (block.blockType === BLOCK_TYPES.contactForm) {
				return <ContactSection key={block.id} copy={form} preview={preview} />;
			}
			if (block.blockType === BLOCK_TYPES.hero) {
				return (
					<section key={block.id} className={styles.hero}>
						<div className={styles.heroImage}>
							<MediaImage
								asset={mediaView(block.image)}
								priority={index === 0}
								cover
								sizes={IMAGE_SIZES.full}
							/>
						</div>
						<div className={styles.heroOverlay} />
						<div className={styles.heroBody}>
							{block.heading && (
								<Heading as={home && index === 0 ? "h1" : "h2"}>
									{block.heading}
								</Heading>
							)}
							{block.text && <p>{block.text}</p>}
							{block.buttonLabel && isSafeHref(block.buttonURL) && (
								<ButtonLink href={block.buttonURL}>
									{block.buttonLabel}
								</ButtonLink>
							)}
						</div>
					</section>
				);
			}
			return (
				<Section key={block.id} className={styles.block}>
					{block.heading && <Heading>{block.heading}</Heading>}
					{block.blockType === BLOCK_TYPES.text && (
						<RichText data={block.body} />
					)}
					{block.blockType === BLOCK_TYPES.textImage && (
						<div
							className={classes(
								styles.textImage,
								block.imagePosition === "left" && styles.imageFirst,
							)}
						>
							<RichText data={block.body} />
							<MediaImage asset={mediaView(block.image)} />
						</div>
					)}
					{block.blockType === BLOCK_TYPES.gallery && (
						<Gallery
							items={(block.gallery || []).flatMap((item) => {
								const asset = mediaView(item.asset);
								return asset ? [{ asset, caption: item.caption }] : [];
							})}
						/>
					)}
					{block.blockType === BLOCK_TYPES.video && (
						<figure className={styles.figure}>
							<MediaVideo asset={mediaView(block.video)} />
							{block.caption && <figcaption>{block.caption}</figcaption>}
						</figure>
					)}
					{block.blockType === BLOCK_TYPES.steps && (
						<ol className={styles.steps}>
							{block.items?.map((step) => (
								<li key={step.id}>
									<h3>{step.title}</h3>
									<p>{step.text}</p>
									{step.duration && <span>{step.duration}</span>}
								</li>
							))}
						</ol>
					)}
					{block.blockType === BLOCK_TYPES.specifications && (
						<dl
							className={classes(
								styles.specifications,
								specificationStyles.list,
							)}
						>
							{block.items?.map((item) => (
								<div key={item.id}>
									<dt>{item.label}</dt>
									<dd>{item.value}</dd>
								</div>
							))}
						</dl>
					)}
					{block.blockType === BLOCK_TYPES.cards && (
						<MaterialCards
							items={(block.items || []).flatMap((item) => {
								const material = item.value;
								return material &&
									typeof material === "object" &&
									(preview || material._status === PUBLICATION.published)
									? [
											{
												collection: item.relationTo as ShowcaseCollection,
												material,
											},
										]
									: [];
							})}
						/>
					)}
					{block.blockType === BLOCK_TYPES.callToAction && (
						<div className={styles.callToAction}>
							<p>{block.text}</p>
							{block.buttonLabel && isSafeHref(block.buttonURL) && (
								<ButtonLink href={block.buttonURL}>
									{block.buttonLabel}
								</ButtonLink>
							)}
						</div>
					)}
				</Section>
			);
		});
}
