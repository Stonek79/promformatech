"use client";

import { Badge } from "@/components/ui/Badge/Badge";
import { COLLECTIONS } from "@/config/content";
import { MEDIA_STATUS } from "@/config/media";
import styles from "./admin.module.css";
import { useJobStatus } from "./useJobStatus";

const PENDING = [MEDIA_STATUS.queued, MEDIA_STATUS.processing];
const LABELS: Record<string, string> = {
	queued: "Ожидает обработки — можно продолжать редактирование",
	processing: "Готовим файл для сайта",
	ready: "Готово к публикации",
	error: "Ошибка обработки — доступен повтор",
};

export function MediaProcessingStatus({ path }: { readonly path: string }) {
	const { id, value } = useJobStatus({
		collection: COLLECTIONS.media,
		path,
		pendingStates: PENDING,
	});
	return (
		<div className={styles.status} role="status" aria-live="polite">
			<span>Готовность</span>
			<Badge
				tone={
					value === MEDIA_STATUS.error
						? "danger"
						: value === MEDIA_STATUS.ready
							? "success"
							: "neutral"
				}
			>
				{id
					? LABELS[value] || "Проверяем файл"
					: "Обработка начнётся после сохранения"}
			</Badge>
		</div>
	);
}
