import { getCMS } from "@/cms/client";
import {
	COLLECTIONS,
	CONTEXT,
	GLOBALS,
	PUBLICATION,
	SHOWCASE_COLLECTIONS,
} from "@/config/content";
import { cachePublished } from "@/features/content/cache";
import { relationshipID } from "./references";

export const publishedMediaIDs = cachePublished(
	"publishedMediaIDs",
	async (): Promise<number[]> => {
		const cms = await getCMS();
		const ids = new Set<number>();
		for (const collection of [COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS]) {
			const { docs } = await cms.find({
				collection,
				draft: false,
				depth: 0,
				limit: 0,
				pagination: false,
				overrideAccess: false,
				context: { [CONTEXT.publicContent]: true },
				select: { referencedMedia: true },
				where: { _status: { equals: PUBLICATION.published } },
			});
			for (const doc of docs) {
				for (const value of doc.referencedMedia || []) {
					const id = relationshipID(value);
					if (id) {
						ids.add(id);
					}
				}
			}
		}
		const settings = await cms.findGlobal({
			slug: GLOBALS.site,
			draft: false,
			depth: 0,
			overrideAccess: false,
			context: { [CONTEXT.publicContent]: true },
		});
		if (settings._status === PUBLICATION.published) {
			for (const value of settings.referencedMedia || []) {
				const id = relationshipID(value);
				if (id) {
					ids.add(id);
				}
			}
		}
		return [...ids];
	},
);
