"use client";

import { useDocumentInfo } from "@payloadcms/ui";
import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { collectionAPIURL } from "@/config/cms";
import styles from "./admin.module.css";

type Props = {
	readonly resource: "media" | "leads";
	readonly action: "retry" | "notify";
	readonly label: string;
	readonly visible: boolean;
	readonly onSuccess: () => void;
};

export function RetryAction({
	resource,
	action,
	label,
	visible,
	onSuccess,
}: Props) {
	const { id } = useDocumentInfo();
	const [pending, setPending] = useState(false);
	const [error, setError] = useState(false);
	if (!id || !visible) {
		return null;
	}
	async function retry() {
		setPending(true);
		setError(false);
		try {
			const response = await fetch(collectionAPIURL(resource, id, action), {
				method: "POST",
			});
			if (!response.ok) {
				throw new Error("Retry failed");
			}
			onSuccess();
		} catch {
			setError(true);
		} finally {
			setPending(false);
		}
	}
	return (
		<div className={styles.status}>
			<Button onClick={retry} disabled={pending}>
				{pending ? "Ставим в очередь…" : label}
			</Button>
			{error && (
				<p role="alert">
					Не удалось поставить задачу в очередь. Обновите страницу и повторите.
				</p>
			)}
		</div>
	);
}
