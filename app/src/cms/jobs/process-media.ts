import { rm } from "node:fs/promises";
import type { TaskHandler } from "payload";
import { COLLECTIONS } from "@/config/content";
import { JOB_POLICY } from "@/config/jobs";
import { MEDIA_STATUS } from "@/config/media";
import { MEDIA_KIND } from "@/config/media-assets";
import { retryableProcessingError } from "@/features/media/process-errors";
import { processImage } from "@/features/media/process-image";
import { processVideo } from "@/features/media/process-video";
import {
	readProcessingReceipt,
	writeProcessingReceipt,
} from "@/features/media/processing-receipt";
import {
	commitDerivatives,
	confirmOriginal,
	processingDirectory,
	storagePaths,
} from "@/features/media/storage";
import { getMessages } from "@/i18n/messages";

export const runMediaJob: TaskHandler<{
	input: { mediaID: number };
	output: { success: boolean };
}> = async ({ input, req, job }) => {
	const media = await req.payload.findByID({
		collection: COLLECTIONS.media,
		id: input.mediaID,
		depth: 0,
		draft: true,
		overrideAccess: true,
	});
	if (!media.storageKey) {
		throw new Error("Original storage key is missing");
	}
	if (media.kind !== MEDIA_KIND.image && media.kind !== MEDIA_KIND.video) {
		throw new Error("Unsupported media kind");
	}
	await confirmOriginal(media.storageKey);
	if (media.processingStatus === MEDIA_STATUS.ready) {
		return { output: { success: true } };
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
		const completed = await readProcessingReceipt(media.storageKey, media.kind);
		const original = storagePaths(media.storageKey).original;
		const details =
			completed?.details ||
			(media.kind === MEDIA_KIND.image
				? await processImage(original, staging)
				: await processVideo(original, staging));
		let derivativeKey = completed?.derivativeKey;
		if (!derivativeKey) {
			await writeProcessingReceipt(staging, details);
			derivativeKey = await commitDerivatives(media.storageKey, staging);
		}
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
		const messages = getMessages().cms.mediaProcessing;
		const transient = retryableProcessingError(error);
		const retry = transient && (job.totalTried || 0) < JOB_POLICY.retryAttempts;
		await req.payload.update({
			collection: COLLECTIONS.media,
			id: media.id,
			draft: true,
			data: {
				processingStatus: retry ? MEDIA_STATUS.queued : MEDIA_STATUS.error,
				error: retry
					? messages.interrupted
					: transient
						? messages.exhausted
						: messages.failed,
			},
			overrideAccess: true,
		});
		req.payload.logger.error(
			{ err: error, mediaID: media.id },
			"Media processing failed",
		);
		if (transient) {
			throw error;
		}
		// Bad input is a handled terminal outcome; only thrown transient errors invoke Payload retries.
		return { output: { success: false } };
	} finally {
		await rm(staging, { recursive: true, force: true });
	}
};
