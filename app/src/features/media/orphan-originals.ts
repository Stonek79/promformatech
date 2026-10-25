import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";
import { COLLECTIONS } from "@/config/content";
import { MEDIA_UPLOAD } from "@/config/media";
import { MEDIA_STORAGE } from "@/config/media-storage";
import { cleanupStaleProcessing } from "./cleanup-staging";
import {
	confirmOriginal,
	removeUncommittedOriginal,
	SAFE_STORAGE_KEY,
	STORAGE_ROOT,
} from "./storage";

export async function reconcileOriginal(cms: Payload, key: string) {
	const referenced = await cms.count({
		collection: COLLECTIONS.media,
		where: { storageKey: { equals: key } },
		overrideAccess: true,
	});
	if (referenced.totalDocs) {
		await confirmOriginal(key);
		return;
	}
	await removeUncommittedOriginal(key);
}

export async function reconcilePendingOriginals(cms: Payload) {
	await cleanupStaleProcessing();
	const directory = path.join(STORAGE_ROOT, MEDIA_STORAGE.pending);
	const entries = await readdir(directory);
	const keys = entries
		.filter((key) => SAFE_STORAGE_KEY.test(key))
		.slice(0, MEDIA_UPLOAD.reconcileLimit);
	for (const key of keys) {
		const marker = await stat(path.join(directory, key));
		if (Date.now() - marker.mtimeMs < MEDIA_UPLOAD.orphanGraceMilliseconds) {
			continue;
		}
		await reconcileOriginal(cms, key);
	}
}
