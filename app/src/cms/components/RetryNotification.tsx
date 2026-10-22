"use client";

import { CMS_ACTIONS } from "@/config/cms";
import { COLLECTIONS } from "@/config/content";
import { NOTIFICATION_STATUS } from "@/config/forms";
import { RetryAction } from "./RetryAction";
import { useJobStatus } from "./useJobStatus";

const PENDING = [NOTIFICATION_STATUS.pending];

export function RetryNotification() {
	const { value, setValue } = useJobStatus({
		collection: COLLECTIONS.leads,
		path: "notificationStatus",
		pendingStates: PENDING,
	});
	return (
		<RetryAction
			resource={COLLECTIONS.leads}
			action={CMS_ACTIONS.retryNotification}
			label="Повторить уведомление"
			visible={
				value === NOTIFICATION_STATUS.failed ||
				value === NOTIFICATION_STATUS.unconfigured
			}
			onSuccess={() => setValue(NOTIFICATION_STATUS.pending, true)}
		/>
	);
}
