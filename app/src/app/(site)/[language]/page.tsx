import { notFound } from "next/navigation";
import { PAGE_SLUGS } from "@/config/content";
import { PageView } from "@/features/content/components/PageView";
import { contentMetadata } from "@/features/content/metadata";
import { pageMetadataCopy } from "@/features/content/page-locales";
import { readPage, readSettings } from "@/features/content/read";
import { getViewer } from "@/features/content/viewer";
import { getSiteLocale } from "@/i18n/site-server";

export async function generateMetadata() {
	const locale = await getSiteLocale();
	const viewer = await getViewer(locale);
	const [page, settings] = await Promise.all([
		readPage(PAGE_SLUGS.home, viewer),
		readSettings(viewer),
	]);
	return contentMetadata(
		pageMetadataCopy(page),
		settings,
		viewer.preview,
		locale,
	);
}

export default async function HomePage() {
	const locale = await getSiteLocale();
	const viewer = await getViewer(locale);
	const page = await readPage(PAGE_SLUGS.home, viewer);
	if (!page) {
		notFound();
	}
	return (
		<PageView
			document={page}
			viewer={viewer}
			locale={locale}
			settings={await readSettings(viewer)}
		/>
	);
}
