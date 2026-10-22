import { notFound } from "next/navigation";
import { PAGE_SLUGS } from "@/config/content";
import { PageView } from "@/features/content/components/PageView";
import { contentMetadata } from "@/features/content/metadata";
import { readPage, readSettings } from "@/features/content/read";
import { getViewer } from "@/features/content/viewer";

export async function generateMetadata() {
	const viewer = await getViewer();
	return contentMetadata(
		await readPage(PAGE_SLUGS.home, viewer),
		await readSettings(viewer),
		viewer.preview,
	);
}

export default async function HomePage() {
	const viewer = await getViewer();
	const page = await readPage(PAGE_SLUGS.home, viewer);
	if (!page) {
		notFound();
	}
	return (
		<PageView
			page={page}
			viewer={viewer}
			settings={await readSettings(viewer)}
		/>
	);
}
