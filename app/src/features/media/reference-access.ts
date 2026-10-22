import type { Payload, PayloadRequest } from "payload";
import {
	COLLECTIONS,
	GLOBALS,
	PUBLICATION,
	SHOWCASE_COLLECTIONS,
} from "@/config/content";

export async function isMediaPublished(
	payload: Payload,
	id: number,
	req?: PayloadRequest,
) {
	for (const collection of [COLLECTIONS.pages, ...SHOWCASE_COLLECTIONS]) {
		const found = await payload.count({
			collection,
			overrideAccess: true,
			req,
			where: {
				and: [
					{ _status: { equals: PUBLICATION.published } },
					{ referencedMedia: { in: [id] } },
				],
			},
		});
		if (found.totalDocs > 0) {
			return true;
		}
	}
	const site = await payload.findGlobal({
		slug: GLOBALS.site,
		draft: false,
		depth: 0,
		overrideAccess: true,
		req,
	});
	return (
		site._status === PUBLICATION.published &&
		site.referencedMedia?.some((value) => value === id)
	);
}
