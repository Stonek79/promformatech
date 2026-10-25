import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { MEDIA_UPLOAD } from "@/config/media";
import { MEDIA_STORAGE } from "@/config/media-storage";
import { STORAGE_ROOT } from "./storage";

const PROCESSING_DIRECTORY = /^[a-f\d-]{36}-[A-Za-z\d]{6}$/;

export async function cleanupStaleProcessing() {
	const directory = path.join(STORAGE_ROOT, MEDIA_STORAGE.staging);
	const entries = await readdir(directory);
	for (const name of entries
		.filter((entry) => PROCESSING_DIRECTORY.test(entry))
		.slice(0, MEDIA_UPLOAD.reconcileLimit)) {
		const location = path.join(directory, name);
		const information = await stat(location);
		if (!information.isDirectory()) {
			continue;
		}
		if (
			Date.now() - information.mtimeMs <
			MEDIA_UPLOAD.orphanGraceMilliseconds
		) {
			continue;
		}
		await rm(location, { recursive: true, force: true });
	}
}
