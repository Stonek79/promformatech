import path from "node:path";
import type { Payload } from "payload";
import { COLLECTIONS, GLOBALS } from "@/config/content";
import { JOBS } from "@/config/jobs";
import { MEDIA_STATUS } from "@/config/media";
import { type AssetKey, type AssetLookup, SOURCE_ASSETS } from "./assets";
import { initialProducts, initialServices } from "./materials";
import { seedInitialPages } from "./pages";
import { seedInitialSettings } from "./settings";

export async function seedSite(cms: Payload) {
	const assets = new Map<AssetKey, number>();
	for (const source of SOURCE_ASSETS) {
		const existing = await cms.find({
			collection: COLLECTIONS.media,
			where: { seedKey: { equals: source.key } },
			limit: 1,
			depth: 0,
			draft: true,
			overrideAccess: true,
		});
		const media =
			existing.docs[0] ||
			(await cms.create({
				collection: COLLECTIONS.media,
				data: { title: source.title, alt: source.title, seedKey: source.key },
				filePath: path.resolve("seed-assets", source.file),
				overrideAccess: true,
			}));
		assets.set(source.key, media.id);
	}
	for (let index = 0; index < SOURCE_ASSETS.length; index++) {
		await cms.jobs.run({ queue: JOBS.mediaQueue, limit: 1, sequential: true });
	}
	const asset: AssetLookup = (key) => {
		const id = assets.get(key);
		if (!id) {
			throw new Error(`Missing seed asset: ${key}`);
		}
		return id;
	};
	for (const id of assets.values()) {
		const media = await cms.findByID({
			collection: COLLECTIONS.media,
			id,
			draft: true,
			depth: 0,
			overrideAccess: true,
		});
		if (media.processingStatus !== MEDIA_STATUS.ready) {
			throw new Error(`Source image is not ready: ${media.title}`);
		}
	}
	const serviceIDs: number[] = [];
	for (const data of initialServices(asset)) {
		const found = await cms.find({
			collection: COLLECTIONS.services,
			where: { slug: { equals: data.slug } },
			limit: 1,
			draft: true,
			depth: 0,
			overrideAccess: true,
		});
		const service =
			found.docs[0] ||
			(await cms.create({
				collection: COLLECTIONS.services,
				data,
				overrideAccess: true,
			}));
		serviceIDs.push(service.id);
	}
	for (const data of initialProducts(asset)) {
		const found = await cms.count({
			collection: COLLECTIONS.products,
			where: { slug: { equals: data.slug } },
			overrideAccess: true,
		});
		if (!found.totalDocs) {
			await cms.create({
				collection: COLLECTIONS.products,
				data,
				overrideAccess: true,
			});
		}
	}
	await seedInitialPages(cms, asset, serviceIDs);
	const settings = await cms.findGlobal({
		slug: GLOBALS.site,
		draft: true,
		overrideAccess: true,
	});
	if (!settings.companyName) {
		await seedInitialSettings(cms, asset);
	}
	cms.logger.info(
		"Начальные материалы добавлены. Существующий контент не перезаписан.",
	);
}
