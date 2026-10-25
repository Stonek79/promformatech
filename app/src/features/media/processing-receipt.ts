import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { JOB_POLICY } from "@/config/jobs";
import {
	MEDIA_KIND,
	MEDIA_VARIANTS,
	type MediaKind,
} from "@/config/media-assets";
import { SAFE_STORAGE_KEY, storagePaths } from "./storage";

export type ProcessingDetails = {
	readonly kind: MediaKind;
	readonly width: number;
	readonly height: number;
	readonly optimizedBytes: number;
	readonly duration?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function positive(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function processingDetails(value: unknown): ProcessingDetails | undefined {
	if (!isRecord(value) || value.version !== JOB_POLICY.receiptVersion) {
		return;
	}
	if (!isRecord(value.details)) {
		return;
	}
	const details = value.details;
	if (details.kind !== MEDIA_KIND.image && details.kind !== MEDIA_KIND.video) {
		return;
	}
	if (
		!positive(details.width) ||
		!positive(details.height) ||
		!positive(details.optimizedBytes)
	) {
		return;
	}
	if (details.kind === MEDIA_KIND.video && !positive(details.duration)) {
		return;
	}
	return {
		kind: details.kind,
		width: details.width,
		height: details.height,
		optimizedBytes: details.optimizedBytes,
		duration: positive(details.duration) ? details.duration : undefined,
	};
}

export async function writeProcessingReceipt(
	directory: string,
	details: ProcessingDetails,
) {
	await writeFile(
		path.join(directory, JOB_POLICY.receiptFile),
		JSON.stringify({ version: JOB_POLICY.receiptVersion, details }),
		{ flag: "wx" },
	);
}

export async function readProcessingReceipt(
	storageKey: string,
	kind: MediaKind,
) {
	const directory = storagePaths(storageKey).derived;
	let entries: string[];
	try {
		entries = await readdir(directory);
	} catch (error) {
		if (isRecord(error) && error.code === "ENOENT") {
			return;
		}
		throw error;
	}
	for (const derivativeKey of entries.filter((key) =>
		SAFE_STORAGE_KEY.test(key),
	)) {
		const folder = path.join(directory, derivativeKey);
		try {
			const parsed: unknown = JSON.parse(
				await readFile(path.join(folder, JOB_POLICY.receiptFile), "utf8"),
			);
			const details = processingDetails(parsed);
			if (!details || details.kind !== kind) {
				continue;
			}
			const variants =
				kind === MEDIA_KIND.image
					? [MEDIA_VARIANTS.image, MEDIA_VARIANTS.small, MEDIA_VARIANTS.medium]
					: [MEDIA_VARIANTS.video, MEDIA_VARIANTS.poster];
			const files = await Promise.all(
				variants.map((variant) => stat(path.join(folder, variant.file))),
			);
			if (files.every((file) => file.isFile() && file.size > 0)) {
				return { details, derivativeKey };
			}
		} catch {
			// An incomplete or older output is never advertised as a completed derivative.
		}
	}
}
