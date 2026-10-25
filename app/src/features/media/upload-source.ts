import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import type { PayloadRequest } from "payload";
import { MEDIA_POLICY, MEDIA_SOURCE } from "@/config/media";
import { MEDIA_STORAGE } from "@/config/media-storage";

export type OriginalSource =
	| Buffer
	| { readonly kind: typeof MEDIA_SOURCE.temporary; readonly path: string };

export function uploadDirectory() {
	return path.resolve(
		/* turbopackIgnore: true */ process.env.MEDIA_ROOT ||
			MEDIA_STORAGE.defaultRoot,
		MEDIA_STORAGE.uploads,
	);
}

export function uploadSource(
	file: NonNullable<PayloadRequest["file"]>,
): OriginalSource {
	if (file.tempFilePath) {
		return { kind: MEDIA_SOURCE.temporary, path: file.tempFilePath };
	}
	return file.data;
}

export async function validateOriginalSource(source: OriginalSource) {
	if (Buffer.isBuffer(source)) {
		if (!source.length || source.length > MEDIA_POLICY.maxFileBytes) {
			throw new Error("Original file size is outside the allowed range");
		}
		return;
	}
	const [root, location, information] = await Promise.all([
		realpath(uploadDirectory()),
		realpath(source.path),
		lstat(source.path),
	]);
	if (path.dirname(location) !== root || information.isSymbolicLink()) {
		throw new Error(
			"Temporary upload must belong to the server upload directory",
		);
	}
	if (
		!information.isFile() ||
		!information.size ||
		information.size > MEDIA_POLICY.maxFileBytes
	) {
		throw new Error("Original file size is outside the allowed range");
	}
}
