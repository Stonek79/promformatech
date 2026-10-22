import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	MEDIA_DELIVERY,
	MEDIA_STORAGE,
	MEDIA_VARIANTS,
	type MediaVariant,
} from "@/config/media";

// Uploaded files belong to the runtime volume, never to the application build.
const STORAGE_ROOT = path.resolve(
	/* turbopackIgnore: true */ process.env.MEDIA_ROOT ||
		MEDIA_STORAGE.defaultRoot,
);
const SAFE_STORAGE_KEY = /^[a-f\d-]{36}$/;

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

export async function saveOriginal(data: Buffer) {
	const key = randomUUID();
	const { original } = storagePaths(key);
	await mkdir(path.dirname(original), { recursive: true });
	await writeFile(`${original}.tmp`, data, {
		flag: "wx",
		mode: MEDIA_STORAGE.fileMode,
	});
	await rename(`${original}.tmp`, original);
	return key;
}
