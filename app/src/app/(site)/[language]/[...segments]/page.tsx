import { notFound } from "next/navigation";
import { MaterialView } from "@/features/content/components/MaterialView";
import { PageView } from "@/features/content/components/PageView";
import {
	contentMetadata,
	localizedMetadataCopy,
} from "@/features/content/metadata";
import { pageMetadataCopy } from "@/features/content/page-locales";
import { readMaterial, readPage, readSettings } from "@/features/content/read";
import { resolveContentRoute } from "@/features/content/route";
import { getViewer } from "@/features/content/viewer";
import { getSiteLocale } from "@/i18n/site-server";

type Props = { readonly params: Promise<{ segments: string[] }> };

export async function generateMetadata({ params }: Props) {
	const route = resolveContentRoute((await params).segments);
	const locale = await getSiteLocale();
	const viewer = await getViewer(locale),
		settings = await readSettings(viewer);
	if (!route || route.kind === "page") {
		const page = route ? await readPage(route.slug, viewer) : null;
		return contentMetadata(
			pageMetadataCopy(page),
			settings,
			viewer.preview,
			locale,
		);
	}
	const document = await readMaterial(route.collection, route.slug, viewer);
	const content = document
		? localizedMetadataCopy(document.material, document.source, locale)
		: null;
	return contentMetadata(content, settings, viewer.preview, locale);
}

export default async function ContentPage({ params }: Props) {
	const route = resolveContentRoute((await params).segments);
	if (!route) {
		notFound();
	}
	const locale = await getSiteLocale();
	const viewer = await getViewer(locale),
		settings = await readSettings(viewer);
	if (route.kind === "page") {
		const page = await readPage(route.slug, viewer);
		if (!page) {
			notFound();
		}
		return (
			<PageView
				document={page}
				settings={settings}
				viewer={viewer}
				locale={locale}
			/>
		);
	}
	const material = await readMaterial(route.collection, route.slug, viewer);
	if (!material) {
		notFound();
	}
	return (
		<MaterialView
			document={material}
			collection={route.collection}
			settings={settings}
			preview={viewer.preview}
			locale={locale}
		/>
	);
}
