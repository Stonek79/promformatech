import { Icon } from "@/components/ui/Icon/Icon";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { COLLECTIONS, type ShowcaseCollection } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { Gallery } from "@/features/media/Gallery";
import { MediaImage } from "@/features/media/MediaView";
import { PhotoDialog } from "@/features/media/PhotoDialog";
import {
	isReadyImage,
	type MediaView,
	mediaView,
} from "@/features/media/view-model";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { interfaceLabels } from "@/i18n/site-copy";
import { classes } from "@/lib/classes";
import type { Product, Project, SiteSetting } from "@/payload-types";
import { localizedText, matchRows } from "../localized-fields";
import { localizedGallery } from "../localized-gallery";
import type { LocalizedMaterial } from "../material-locales";
import { ContentBlocks } from "./Blocks";
import styles from "./pages.module.css";
import specificationStyles from "./specifications.module.css";

type Props = {
	readonly document: LocalizedMaterial;
	readonly collection: ShowcaseCollection;
	readonly settings: SiteSetting;
	readonly preview: boolean;
	readonly locale: Locale;
};

const PROJECT_SECTIONS = ["task", "solution", "result"] as const;

function ProjectStory({
	material,
	source,
	locale,
	labels,
}: {
	readonly material: Project;
	readonly source?: Project;
	readonly locale: Locale;
	readonly labels: Pick<
		ReturnType<typeof interfaceLabels>,
		(typeof PROJECT_SECTIONS)[number]
	>;
}) {
	return (
		<Section className={styles.case}>
			{PROJECT_SECTIONS.map((key) => {
				const text = localizedText(locale, material[key], source?.[key]);
				if (!text.value) {
					return null;
				}
				return (
					<div key={key}>
						<Heading>{labels[key]}</Heading>
						<p lang={text.lang}>{text.value}</p>
					</div>
				);
			})}
		</Section>
	);
}

function ProductSpecifications({
	rows,
	source,
	locale,
	label,
}: {
	readonly rows: Product["specifications"];
	readonly source?: Product["specifications"];
	readonly locale: Locale;
	readonly label: string;
}) {
	if (!rows?.length) {
		return null;
	}
	return (
		<div>
			<Heading className={specificationStyles.title}>{label}</Heading>
			<dl className={classes(styles.specifications, specificationStyles.list)}>
				{matchRows(rows, source, (row, original) => {
					const name = localizedText(locale, row.label, original?.label);
					const value = localizedText(locale, row.value, original?.value);
					return (
						<div key={row.id}>
							<dt lang={name.lang}>{name.value}</dt>
							<dd lang={value.lang}>{value.value}</dd>
						</div>
					);
				})}
			</dl>
		</div>
	);
}

function MaterialCover({
	asset,
	collection,
	locale,
}: {
	readonly asset: MediaView;
	readonly collection: ShowcaseCollection;
	readonly locale: Locale;
}) {
	const product = collection === COLLECTIONS.products;
	const service = collection === COLLECTIONS.services;
	const { media } = getMessages(locale);
	const photo = (
		<MediaImage
			asset={asset}
			priority
			fill={product || service}
			cover={product || service}
			alt={service ? "" : undefined}
			sizes={
				product
					? IMAGE_SIZES.productPhoto
					: service
						? IMAGE_SIZES.servicePhoto
						: IMAGE_SIZES.columns
			}
		/>
	);
	return (
		<figure
			className={classes(
				styles.coverFigure,
				service && styles.serviceIllustration,
			)}
		>
			{service ? (
				<div className={styles.serviceFrame}>{photo}</div>
			) : (
				<PhotoDialog
					asset={asset}
					caption={asset.caption}
					trigger={
						<button
							type="button"
							className={classes(
								styles.coverButton,
								product && styles.productCover,
							)}
							aria-label={media.open(asset.title)}
						>
							{photo}
							<span className={styles.coverHint}>
								<Icon name="expand" />
							</span>
						</button>
					}
				/>
			)}
			{asset.caption && (
				<figcaption lang={DEFAULT_LOCALE}>{asset.caption}</figcaption>
			)}
		</figure>
	);
}

export function MaterialView({
	document,
	collection,
	settings,
	preview,
	locale,
}: Props) {
	const { material, source } = document;
	const labels = interfaceLabels(settings, locale);
	const title = localizedText(locale, material.title, source?.title);
	const summary = localizedText(locale, material.summary, source?.summary);
	const gallery = localizedGallery(locale, material.gallery, source?.gallery);
	const cover = mediaView(material.featuredImage);
	const readyCover = isReadyImage(cover);
	const product = collection === COLLECTIONS.products;
	const service = collection === COLLECTIONS.services;
	const specifications =
		product && "specifications" in material ? material.specifications : null;
	const hasIntroduction = readyCover || Boolean(summary.value);
	const description = summary.value && (
		<p lang={summary.lang}>{summary.value}</p>
	);
	return (
		<article
			className={classes(product && styles.product, service && styles.service)}
		>
			<header className={styles.pageHeader}>
				<Heading
					as="h1"
					lang={title.lang}
					className={product ? styles.productTitle : undefined}
				>
					{title.value}
				</Heading>
			</header>
			{(hasIntroduction || !!specifications?.length) && (
				<Section
					className={classes(
						product && styles.overview,
						hasIntroduction &&
							!!specifications?.length &&
							styles.productColumns,
					)}
				>
					{hasIntroduction && (
						<div
							className={classes(
								styles.introduction,
								service &&
									readyCover &&
									Boolean(description) &&
									styles.serviceColumns,
							)}
						>
							{service && description}
							{readyCover && (
								<MaterialCover
									asset={cover}
									collection={collection}
									locale={locale}
								/>
							)}
							{!service && description}
						</div>
					)}
					{!!specifications?.length && (
						<ProductSpecifications
							rows={specifications}
							source={
								source && "specifications" in source
									? source.specifications
									: undefined
							}
							locale={locale}
							label={labels.specifications}
						/>
					)}
				</Section>
			)}
			{collection === COLLECTIONS.projects && (
				<ProjectStory
					material={material as Project}
					source={source as Project | undefined}
					locale={locale}
					labels={labels}
				/>
			)}
			{!!gallery.length && (
				<Section>
					<Heading>{labels.gallery}</Heading>
					<Gallery items={gallery} staticPhotos={service} />
				</Section>
			)}
			<ContentBlocks
				blocks={material.blocks}
				source={source?.blocks}
				contentLocale={document.locale}
				preview={preview}
				staticPhotos={service}
				locale={locale}
			/>
		</article>
	);
}
