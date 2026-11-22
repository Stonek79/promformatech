"use client";

import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button/Button";
import { ROUTES } from "@/config/content";
import { SITE_LANGUAGE_QUERY } from "@/i18n/config";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
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
	const locale = useLocale();
	return (
		<aside className={styles.banner} aria-label={messages.label}>
			<RefreshRouteOnSave refresh={router.refresh} serverURL={serverURL} />
			<span>{messages.status}</span>
			<a href={editURL}>{messages.back}</a>
			<form action={ROUTES.exitPreview} method="get">
				<input type="hidden" name={SITE_LANGUAGE_QUERY} value={locale} />
				<Button type="submit" variant="secondary">
					{messages.exit}
				</Button>
			</form>
		</aside>
	);
}
