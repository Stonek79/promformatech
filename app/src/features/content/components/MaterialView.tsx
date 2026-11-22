import { Heading, Section } from "@/components/ui/Layout/Layout";
import { COLLECTIONS, type ShowcaseCollection } from "@/config/content";
import { Gallery } from "@/features/media/Gallery";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import type { Locale } from "@/i18n/config";
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
		<Section>
			<Heading>{label}</Heading>
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
		</Section>
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
	return (
		<article>
			<header className={styles.pageHeader}>
				<Heading as="h1" lang={title.lang}>
					{title.value}
				</Heading>
			</header>
			<Section className={styles.introduction}>
				<MediaImage asset={mediaView(material.featuredImage)} priority />
				<p lang={summary.lang}>{summary.value}</p>
			</Section>
			{collection === COLLECTIONS.projects && (
				<ProjectStory
					material={material as Project}
					source={source as Project | undefined}
					locale={locale}
					labels={labels}
				/>
			)}
			{collection === COLLECTIONS.products && "specifications" in material && (
				<ProductSpecifications
					rows={material.specifications}
					source={
						source && "specifications" in source
							? source.specifications
							: undefined
					}
					locale={locale}
					label={labels.specifications}
				/>
			)}
			{!!gallery.length && (
				<Section>
					<Heading>{labels.gallery}</Heading>
					<Gallery items={gallery} />
				</Section>
			)}
			<ContentBlocks
				blocks={material.blocks}
				source={source?.blocks}
				contentLocale={document.locale}
				preview={preview}
				locale={locale}
			/>
		</article>
	);
}
