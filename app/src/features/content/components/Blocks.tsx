import { ButtonLink } from "@/components/ui/Button/Button";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { BLOCK_TYPES } from "@/config/blocks";
import { IMAGE_SIZES } from "@/config/image";
import { Gallery } from "@/features/media/Gallery";
import { MediaImage, MediaVideo } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { localizedPublicHref } from "@/i18n/site-copy";
import { classes } from "@/lib/classes";
import { isPublicHref } from "@/lib/urls";
import {
	type ArticleBlock,
	blockOfType,
	localizedBody,
} from "../article-blocks";
import { localizedText, matchRows } from "../localized-fields";
import { localizedGallery } from "../localized-gallery";
import { relatedMaterialCards } from "../material-locales";
import styles from "./content.module.css";
import { MaterialCards } from "./MaterialCards";
import { RichText } from "./RichText";
import { Specifications, Steps } from "./StructuredBlocks";

type Blocks = ArticleBlock[];
type Props = {
	readonly blocks: Blocks | null | undefined;
	readonly source?: Blocks | null;
	readonly preview: boolean;
	readonly home?: boolean;
	readonly locale: Locale;
	readonly contentLocale?: Locale;
};

type BannerBlock = Extract<
	ArticleBlock,
	{
		blockType: typeof BLOCK_TYPES.hero | typeof BLOCK_TYPES.callToAction;
	}
>;

function BannerText({
	block,
	original,
	locale,
	language,
}: {
	readonly block: BannerBlock;
	readonly original?: BannerBlock;
	readonly locale: Locale;
	readonly language: Locale;
}) {
	const text = localizedText(language, block.text, original?.text);
	const button = localizedText(
		language,
		block.buttonLabel,
		original?.buttonLabel,
	);
	return (
		<>
			{text.value && <p lang={text.lang}>{text.value}</p>}
			{button.value && isPublicHref(block.buttonURL) && (
				<ButtonLink href={localizedPublicHref(block.buttonURL, locale)}>
					<span lang={button.lang}>{button.value}</span>
				</ButtonLink>
			)}
		</>
	);
}

function BlockContent({
	block,
	original,
	locale,
	language,
	preview,
}: {
	readonly block: ArticleBlock;
	readonly original?: ArticleBlock;
	readonly locale: Locale;
	readonly language: Locale;
	readonly preview: boolean;
}) {
	switch (block.blockType) {
		case BLOCK_TYPES.text: {
			const source = blockOfType(original, block.blockType);
			return (
				<RichText
					{...localizedBody(language, block.body, source?.body)}
					locale={locale}
				/>
			);
		}
		case BLOCK_TYPES.textImage: {
			const source = blockOfType(original, block.blockType);
			return (
				<div
					className={classes(
						styles.textImage,
						block.imagePosition === "left" && styles.imageFirst,
					)}
				>
					<RichText
						{...localizedBody(language, block.body, source?.body)}
						locale={locale}
					/>
					<MediaImage asset={mediaView(block.image)} />
				</div>
			);
		}
		case BLOCK_TYPES.gallery: {
			const source = blockOfType(original, block.blockType);
			return (
				<Gallery
					items={localizedGallery(language, block.gallery, source?.gallery)}
				/>
			);
		}
		case BLOCK_TYPES.video: {
			const source = blockOfType(original, block.blockType);
			const caption = localizedText(language, block.caption, source?.caption);
			return (
				<figure className={styles.figure}>
					<MediaVideo asset={mediaView(block.video)} locale={locale} />
					{caption.value && (
						<figcaption lang={caption.lang}>{caption.value}</figcaption>
					)}
				</figure>
			);
		}
		case BLOCK_TYPES.steps:
			return (
				<Steps
					block={block}
					original={blockOfType(original, block.blockType)}
					language={language}
				/>
			);
		case BLOCK_TYPES.specifications:
			return (
				<Specifications
					block={block}
					original={blockOfType(original, block.blockType)}
					language={language}
				/>
			);
		case BLOCK_TYPES.cards:
			return (
				<MaterialCards
					locale={locale}
					items={relatedMaterialCards(
						block,
						blockOfType(original, block.blockType),
						language,
						preview,
					)}
				/>
			);
		case BLOCK_TYPES.callToAction:
			return (
				<div className={styles.callToAction}>
					<BannerText
						block={block}
						original={blockOfType(original, block.blockType)}
						locale={locale}
						language={language}
					/>
				</div>
			);
		default:
			return null;
	}
}

export function ContentBlocks({
	blocks,
	source,
	preview,
	home,
	locale,
	contentLocale = DEFAULT_LOCALE,
}: Props) {
	return matchRows(
		blocks?.filter((block) => block.visible !== false),
		source,
		(block, original) => ({
			block,
			original: blockOfType(original, block.blockType),
		}),
	).map(({ block, original }, index) => {
		const heading = localizedText(
			contentLocale,
			block.heading,
			original?.heading,
		);
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
						{heading.value && (
							<Heading
								as={home && index === 0 ? "h1" : "h2"}
								lang={heading.lang}
							>
								{heading.value}
							</Heading>
						)}
						<BannerText
							block={block}
							original={blockOfType(original, block.blockType)}
							locale={locale}
							language={contentLocale}
						/>
					</div>
				</section>
			);
		}
		return (
			<Section key={block.id} className={styles.block}>
				{heading.value && (
					<Heading lang={heading.lang}>{heading.value}</Heading>
				)}
				<BlockContent
					block={block}
					original={original}
					locale={locale}
					language={contentLocale}
					preview={preview}
				/>
			</Section>
		);
	});
}
