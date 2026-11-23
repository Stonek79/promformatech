import { Heading, Section } from "@/components/ui/Layout/Layout";
import { BLOCK_TYPES } from "@/config/blocks";
import { PAGE_KINDS } from "@/config/content";
import type { Locale } from "@/i18n/config";
import { interfaceLabels } from "@/i18n/site-copy";
import { blockOfType } from "../article-blocks";
import { localizedText } from "../localized-fields";
import { type LocalizedPage, pageHeading } from "../page-locales";
import { readMaterials } from "../read";
import type { SiteSettingsView } from "../site-settings";
import type { Viewer } from "../viewer";
import { ContentBlocks } from "./Blocks";
import { Contacts } from "./Contacts";
import { MaterialCards } from "./MaterialCards";
import styles from "./pages.module.css";

type Props = {
	readonly document: LocalizedPage;
	readonly viewer: Viewer;
	readonly settings: SiteSettingsView;
	readonly locale: Locale;
};

export async function PageView({ document, viewer, settings, locale }: Props) {
	const { page, source } = document;
	const home = page.kind === PAGE_KINDS.home;
	const list =
		page.kind === PAGE_KINDS.products ||
		page.kind === PAGE_KINDS.services ||
		page.kind === PAGE_KINDS.projects
			? page.kind
			: null;
	const materials = list ? await readMaterials(list, viewer) : [];
	const firstBlock = page.blocks?.find((block) => block.visible !== false);
	const firstSource = firstBlock?.id
		? source?.blocks?.find((block) => block.id === firstBlock.id)
		: undefined;
	const heroHasHeading =
		home &&
		firstBlock?.blockType === BLOCK_TYPES.hero &&
		localizedText(
			locale,
			firstBlock.heading,
			blockOfType(firstSource, BLOCK_TYPES.hero)?.heading,
		).value;
	const heading = pageHeading(document);
	return (
		<article
			className={list === PAGE_KINDS.services ? styles.service : undefined}
		>
			{!heroHasHeading && (
				<header className={styles.pageHeader}>
					<Heading as="h1" lang={heading.lang}>
						{heading.value}
					</Heading>
				</header>
			)}
			{list && (
				<Section>
					{materials.length ? (
						<MaterialCards
							compact={list === PAGE_KINDS.products}
							prioritizeFirstRow
							headingLevel="h2"
							locale={locale}
							items={materials}
						/>
					) : (
						<p>{interfaceLabels(settings, locale).emptyList}</p>
					)}
				</Section>
			)}
			{page.kind === PAGE_KINDS.contacts && (
				<Section>
					<Contacts settings={settings} locale={locale} />
				</Section>
			)}
			<ContentBlocks
				blocks={page.blocks}
				source={source?.blocks}
				contentLocale={document.locale}
				preview={viewer.preview}
				home={home}
				locale={locale}
			/>
		</article>
	);
}
