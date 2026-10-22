import { rm } from "node:fs/promises";
import type { TaskConfig } from "payload";
import { COLLECTIONS } from "@/config/content";
import { JOBS, MEDIA_KIND, MEDIA_STATUS } from "@/config/media";
import { processImage } from "@/features/media/process-image";
import { processVideo } from "@/features/media/process-video";
import {
	commitDerivatives,
	processingDirectory,
	storagePaths,
} from "@/features/media/storage";

export const processMediaTask: TaskConfig<{
	input: { mediaID: number };
	output: { success: boolean };
}> = {
	slug: JOBS.processMedia,
	label: "Подготовка фото и видео",
	retries: 0,
	concurrency: () => JOBS.mediaQueue,
	inputSchema: [{ name: "mediaID", type: "number", required: true }],
	outputSchema: [{ name: "success", type: "checkbox" }],
	handler: async ({ input, req }) => {
		const media = await req.payload.findByID({
			collection: COLLECTIONS.media,
			id: input.mediaID,
			depth: 0,
			draft: true,
			overrideAccess: true,
		});
		if (media.processingStatus === MEDIA_STATUS.ready) {
			return { output: { success: true } };
		}
		if (!media.storageKey) {
			throw new Error("Original storage key is missing");
		}
		await req.payload.update({
			collection: COLLECTIONS.media,
			id: media.id,
			draft: true,
			data: { processingStatus: MEDIA_STATUS.processing, error: null },
			overrideAccess: true,
		});
		const staging = await processingDirectory(media.storageKey);
		try {
			const original = storagePaths(media.storageKey).original;
			const details =
				media.kind === MEDIA_KIND.image
					? await processImage(original, staging)
					: await processVideo(original, staging);
			const derivativeKey = await commitDerivatives(media.storageKey, staging);
			await req.payload.update({
				collection: COLLECTIONS.media,
				id: media.id,
				draft: true,
				data: {
					...details,
					derivativeKey,
					processingStatus: MEDIA_STATUS.ready,
					error: null,
				},
				overrideAccess: true,
			});
			return { output: { success: true } };
		} catch (error) {
			req.payload.logger.error(
				{ err: error, mediaID: media.id },
				"Media processing failed",
			);
			await req.payload.update({
				collection: COLLECTIONS.media,
				id: media.id,
				draft: true,
				data: {
					processingStatus: MEDIA_STATUS.error,
					error:
						"Не удалось подготовить файл. Проверьте, что он открывается, видео короче 15 минут и имеет разрешение не выше 4K. Можно повторить обработку или загрузить другой файл.",
				},
				overrideAccess: true,
			});
			return { output: { success: false } };
		} finally {
			await rm(staging, { recursive: true, force: true });
		}
	},
};
