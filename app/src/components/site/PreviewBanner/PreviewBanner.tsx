"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { ROUTES } from "@/config/content";
import { useMessages } from "@/i18n/MessagesProvider";
import styles from "./PreviewBanner.module.css";

export function PreviewBanner({
	editURL,
	serverURL,
}: {
	readonly editURL: string;
	readonly serverURL: string;
}) {
	const router = useRouter();
	const { preview: messages } = useMessages();
	return (
		<aside className={styles.banner} aria-label={messages.label}>
			<RefreshRouteOnSave refresh={router.refresh} serverURL={serverURL} />
			<span>{messages.status}</span>
			<a href={editURL}>{messages.back}</a>
			<form action={ROUTES.exitPreview} method="get">
				<Button type="submit" variant="secondary">
					{messages.exit}
				</Button>
			</form>
		</aside>
	);
}
