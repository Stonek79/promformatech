"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { MEDIA_DELIVERY, mediaURL } from "@/config/media";
import styles from "./admin.module.css";

export function OriginalDownload() {
	const { id } = useDocumentInfo();
	if (!id) {
		return null;
	}
	return (
		<div className={styles.actions}>
			<a href={mediaURL(id, MEDIA_DELIVERY.original)} download>
				Скачать исходный файл
			</a>
		</div>
	);
}
