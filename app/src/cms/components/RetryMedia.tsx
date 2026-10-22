"use client";

import { useField } from "@payloadcms/ui";
import { CMS_ACTIONS } from "@/config/cms";
import { COLLECTIONS } from "@/config/content";
import { MEDIA_STATUS } from "@/config/media";
import { RetryAction } from "./RetryAction";

export function RetryMedia() {
	const { value, setValue } = useField<string>({ path: "processingStatus" });
	return (
		<RetryAction
			resource={COLLECTIONS.media}
			action={CMS_ACTIONS.retryMedia}
			label="Повторить обработку исходника"
			visible={value === MEDIA_STATUS.error}
			onSuccess={() => setValue(MEDIA_STATUS.queued, true)}
		/>
	);
}
