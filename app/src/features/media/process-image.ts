import { copyFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { MEDIA_KIND, MEDIA_POLICY, MEDIA_VARIANTS } from "@/config/media";

export async function processImage(original: string, directory: string) {
	sharp.concurrency(MEDIA_POLICY.workerConcurrency);
	const source = sharp(original, {
		limitInputPixels: MEDIA_POLICY.maxImagePixels,
		failOn: "error",
	});
	const metadata = await source.metadata();
	if (
		!metadata.width ||
		!metadata.height ||
		(metadata.pages && metadata.pages > 1)
	) {
		throw new Error("Unsupported or animated image");
	}
	for (const width of MEDIA_POLICY.imageWidths) {
		const file =
			width === MEDIA_POLICY.imageWidths[MEDIA_POLICY.imageWidths.length - 1]
				? MEDIA_VARIANTS.image.file
				: `image-${width}.webp`;
		await source
			.clone()
			.rotate()
			.resize({ width, withoutEnlargement: true })
			.webp({ quality: MEDIA_POLICY.webpQuality })
			.toFile(path.join(directory, file));
	}
	const primary = path.join(directory, MEDIA_VARIANTS.image.file);
	const [originalSize, optimized] = await Promise.all([
		stat(original),
		stat(primary),
	]);
	if (
		metadata.format === "webp" &&
		metadata.width <=
			MEDIA_POLICY.imageWidths[MEDIA_POLICY.imageWidths.length - 1] &&
		originalSize.size < optimized.size &&
		!metadata.orientation
	) {
		await copyFile(original, primary);
	}
	const result = await sharp(primary).metadata();
	return {
		kind: MEDIA_KIND.image,
		width: result.width,
		height: result.height,
		optimizedBytes: (await stat(primary)).size,
	};
}
