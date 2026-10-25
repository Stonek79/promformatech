import type { CollectionAfterErrorHook } from "payload";
import { CONTEXT } from "@/config/content";
import { reconcileOriginal } from "@/features/media/orphan-originals";
import { SAFE_STORAGE_KEY } from "@/features/media/storage";

export const cleanupFailedUpload: CollectionAfterErrorHook = async ({
	req,
	context,
}) => {
	const key = context[CONTEXT.pendingOriginal];
	if (typeof key !== "string" || !SAFE_STORAGE_KEY.test(key)) {
		return;
	}
	try {
		await reconcileOriginal(req.payload, key);
	} catch {
		// A durable pending marker lets the worker retry cleanup after database recovery.
		req.payload.logger.warn(
			"Original cleanup deferred until database recovery",
		);
	}
};
