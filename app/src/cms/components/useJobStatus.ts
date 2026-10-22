"use client";

import { useDocumentInfo, useField } from "@payloadcms/ui";
import { useEffect } from "react";
import { collectionAPIURL } from "@/config/cms";
import { MEDIA_POLICY } from "@/config/media";

type Options = {
	readonly collection: string;
	readonly path: string;
	readonly pendingStates: readonly string[];
};

export function useJobStatus({ collection, path, pendingStates }: Options) {
	const { id } = useDocumentInfo();
	const { value, setValue } = useField<string>({ path });
	useEffect(() => {
		if (!id || !pendingStates.includes(value)) {
			return;
		}
		const controller = new AbortController();
		let busy = false;
		async function refresh() {
			if (busy) {
				return;
			}
			busy = true;
			try {
				const response = await fetch(
					`${collectionAPIURL(collection, id)}?depth=0&draft=true`,
					{
						cache: "no-store",
						signal: controller.signal,
					},
				);
				if (!response.ok) {
					return;
				}
				const data: unknown = await response.json();
				if (data && typeof data === "object" && path in data) {
					const next = (data as Record<string, unknown>)[path];
					if (typeof next === "string" && next !== value) {
						setValue(next, true);
					}
				}
			} catch {
				/* Keep the last known state; the next poll can recover. */
			} finally {
				busy = false;
			}
		}
		void refresh();
		const timer = setInterval(() => {
			void refresh();
		}, MEDIA_POLICY.workerPollMilliseconds);
		return () => {
			clearInterval(timer);
			controller.abort();
		};
	}, [collection, id, path, pendingStates, setValue, value]);
	return { id, value, setValue };
}
