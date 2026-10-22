import { getCMS } from "@/cms/client";
import {
	COLLECTIONS,
	CONTENT_LIMITS,
	CONTEXT,
	GLOBALS,
	type ShowcaseCollection,
} from "@/config/content";
import {
	publishedMaterial,
	publishedMaterials,
	publishedPage,
	publishedSettings,
} from "./queries";
import type { Viewer } from "./viewer";

const previewOptions = (viewer: Viewer) => ({
	draft: true,
	user: viewer.user,
	depth: CONTENT_LIMITS.previewDepth,
	overrideAccess: false,
	context: { [CONTEXT.publicContent]: true },
});

export async function readSettings(viewer: Viewer) {
	if (!viewer.preview) {
		return publishedSettings();
	}
	return (await getCMS()).findGlobal({
		...previewOptions(viewer),
		slug: GLOBALS.site,
	});
}

export async function readPage(slug: string, viewer: Viewer) {
	if (!viewer.preview) {
		return publishedPage(slug);
	}
	const { docs } = await (await getCMS()).find({
		...previewOptions(viewer),
		collection: COLLECTIONS.pages,
		where: { slug: { equals: slug } },
		limit: 1,
	});
	return docs[0] || null;
}

export async function readMaterial(
	collection: ShowcaseCollection,
	slug: string,
	viewer: Viewer,
) {
	if (!viewer.preview) {
		return publishedMaterial(collection, slug);
	}
	const { docs } = await (await getCMS()).find({
		...previewOptions(viewer),
		collection,
		where: { slug: { equals: slug } },
		limit: 1,
	});
	return docs[0] || null;
}

export async function readMaterials(
	collection: ShowcaseCollection,
	viewer: Viewer,
) {
	if (!viewer.preview) {
		return publishedMaterials(collection);
	}
	return (
		await (
			await getCMS()
		).find({
			...previewOptions(viewer),
			collection,
			sort: "order",
			limit: CONTENT_LIMITS.pageSize,
		})
	).docs;
}
