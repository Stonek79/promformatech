import { Heading, Section } from "@/components/ui/Layout/Layout";
import type { ShowcaseCollection } from "@/config/content";
import { PAGE_KINDS } from "@/config/content";
import type { Page, SiteSetting } from "@/payload-types";
import { readMaterials } from "../read";
import type { Viewer } from "../viewer";
import { ContentBlocks } from "./Blocks";
import { Contacts } from "./Contacts";
import { MaterialCards } from "./MaterialCards";
import styles from "./pages.module.css";

type Props = {
	readonly page: Page;
	readonly viewer: Viewer;
	readonly settings: SiteSetting;
};

export async function PageView({ page, viewer, settings }: Props) {
	const home = page.kind === PAGE_KINDS.home;
	const list =
		page.kind === PAGE_KINDS.products ||
		page.kind === PAGE_KINDS.services ||
		page.kind === PAGE_KINDS.projects
			? page.kind
			: null;
	const materials = list ? await readMaterials(list, viewer) : [];
	const firstBlock = page.blocks?.find((block) => block.visible !== false);
	const heroHasHeading =
		home && firstBlock?.blockType === "hero" && firstBlock.heading;
	return (
		<article>
			{!heroHasHeading && (
				<header className={styles.pageHeader}>
					<Heading as="h1">{page.heading || page.title}</Heading>
				</header>
			)}
			{list && (
				<Section>
					{materials.length ? (
						<MaterialCards
							items={materials.map((material) => ({
								collection: list as ShowcaseCollection,
								material,
							}))}
						/>
					) : (
						<p>{settings.labels?.emptyList}</p>
					)}
				</Section>
			)}
			{page.kind === PAGE_KINDS.contacts && (
				<Section>
					<Contacts settings={settings} />
				</Section>
			)}
			<ContentBlocks
				blocks={page.blocks}
				form={settings.form}
				preview={viewer.preview}
				home={home}
			/>
		</article>
	);
}
