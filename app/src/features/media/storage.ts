import { randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
	chmod,
	copyFile,
	mkdir,
	mkdtemp,
	rename,
	rm,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
	MEDIA_DELIVERY,
	MEDIA_VARIANTS,
	type MediaVariant,
} from "@/config/media-assets";
import { MEDIA_STORAGE } from "@/config/media-storage";
import { type OriginalSource, validateOriginalSource } from "./upload-source";

// Uploaded files belong to the runtime volume, never to the application build.
export const STORAGE_ROOT = path.resolve(
	/* turbopackIgnore: true */ process.env.MEDIA_ROOT ||
		MEDIA_STORAGE.defaultRoot,
);
export const SAFE_STORAGE_KEY = /^[a-f\d-]{36}$/;

function pendingOriginalPath(key: string) {
	storagePaths(key);
	return path.join(STORAGE_ROOT, MEDIA_STORAGE.pending, key);
}

export async function confirmOriginal(key: string) {
	await rm(pendingOriginalPath(key), { force: true });
}

export async function removeUncommittedOriginal(key: string) {
	await rm(path.dirname(storagePaths(key).original), {
		recursive: true,
		force: true,
	});
	await confirmOriginal(key);
}

export async function ensureMediaStorage() {
	for (const folder of [
		MEDIA_STORAGE.uploads,
		MEDIA_STORAGE.pending,
		MEDIA_STORAGE.originals,
		MEDIA_STORAGE.derived,
		MEDIA_STORAGE.staging,
	]) {
		const directory = path.join(STORAGE_ROOT, folder);
		await mkdir(directory, {
			recursive: true,
			mode: MEDIA_STORAGE.directoryMode,
		});
		await chmod(directory, MEDIA_STORAGE.directoryMode);
	}
	const probe = await mkdtemp(
		path.join(STORAGE_ROOT, MEDIA_STORAGE.staging, "startup-"),
	);
	try {
		await writeFile(path.join(probe, "probe"), "", {
			flag: "wx",
			mode: MEDIA_STORAGE.fileMode,
		});
	} finally {
		await rm(probe, { recursive: true, force: true });
	}
}

export function storagePaths(key: string) {
	if (!SAFE_STORAGE_KEY.test(key)) {
		throw new Error("Invalid media storage key");
	}
	return {
		original: path.join(
			STORAGE_ROOT,
			MEDIA_STORAGE.originals,
			key,
			MEDIA_DELIVERY.original,
		),
		derived: path.join(STORAGE_ROOT, MEDIA_STORAGE.derived, key),
	};
}

export function variantPath(
	key: string,
	derivativeKey: string,
	variant: MediaVariant,
) {
	if (!SAFE_STORAGE_KEY.test(derivativeKey)) {
		throw new Error("Invalid derivative storage key");
	}
	return path.join(
		storagePaths(key).derived,
		derivativeKey,
		MEDIA_VARIANTS[variant].file,
	);
}

export async function processingDirectory(key: string) {
	storagePaths(key);
	const staging = path.join(STORAGE_ROOT, MEDIA_STORAGE.staging);
	await mkdir(staging, { recursive: true });
	return mkdtemp(path.join(staging, `${key}-`));
}

export async function commitDerivatives(key: string, staging: string) {
	const derivativeKey = randomUUID();
	const { derived } = storagePaths(key);
	await mkdir(derived, { recursive: true });
	await rename(staging, path.join(derived, derivativeKey));
	return derivativeKey;
}

export async function saveOriginal(source: OriginalSource) {
	await validateOriginalSource(source);
	const key = randomUUID();
	const { original } = storagePaths(key);
	await mkdir(path.dirname(pendingOriginalPath(key)), {
		recursive: true,
		mode: MEDIA_STORAGE.directoryMode,
	});
	await writeFile(pendingOriginalPath(key), "", {
		flag: "wx",
		mode: MEDIA_STORAGE.fileMode,
	});
	try {
		await mkdir(path.dirname(original), {
			recursive: true,
			mode: MEDIA_STORAGE.directoryMode,
		});
		const temporary = `${original}.tmp`;
		if (Buffer.isBuffer(source)) {
			await writeFile(temporary, source, {
				flag: "wx",
				mode: MEDIA_STORAGE.fileMode,
			});
		} else {
			await copyFile(source.path, temporary, constants.COPYFILE_EXCL);
			await chmod(temporary, MEDIA_STORAGE.fileMode);
		}
		await rename(temporary, original);
		return key;
	} catch (error) {
		await removeUncommittedOriginal(key);
		throw error;
	}
}
