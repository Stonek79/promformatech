"use client";

import { useTranslation } from "@payloadcms/ui";
import type { ReactNode } from "react";
import { parseLocale } from "@/i18n/config";
import { MessagesProvider } from "@/i18n/MessagesProvider";

export function AdminMessagesProvider({
	children,
}: {
	readonly children: ReactNode;
}) {
	const { i18n } = useTranslation();
	return (
		<MessagesProvider locale={parseLocale(i18n.language)}>
			{children}
		</MessagesProvider>
	);
}
