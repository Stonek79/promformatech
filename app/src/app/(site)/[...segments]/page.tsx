import { notFound } from "next/navigation";
import { MaterialView } from "@/features/content/components/MaterialView";
import { PageView } from "@/features/content/components/PageView";
import { contentMetadata } from "@/features/content/metadata";
import { readMaterial, readPage, readSettings } from "@/features/content/read";
import { resolveContentRoute } from "@/features/content/route";
import { getViewer } from "@/features/content/viewer";

type Props = { readonly params: Promise<{ segments: string[] }> };

export async function generateMetadata({ params }: Props) {
	const route = resolveContentRoute((await params).segments);
	const viewer = await getViewer(),
		settings = await readSettings(viewer);
	const content =
		route?.kind === "page"
			? await readPage(route.slug, viewer)
			: route
				? await readMaterial(route.collection, route.slug, viewer)
				: null;
	return contentMetadata(content, settings, viewer.preview);
}

export default async function ContentPage({ params }: Props) {
	const route = resolveContentRoute((await params).segments);
	if (!route) {
		notFound();
	}
	const viewer = await getViewer(),
		settings = await readSettings(viewer);
	if (route.kind === "page") {
		const page = await readPage(route.slug, viewer);
		if (!page) {
			notFound();
		}
		return <PageView page={page} settings={settings} viewer={viewer} />;
	}
	const material = await readMaterial(route.collection, route.slug, viewer);
	if (!material) {
		notFound();
	}
	return (
		<MaterialView
			material={material}
			collection={route.collection}
			settings={settings}
			preview={viewer.preview}
		/>
	);
}
