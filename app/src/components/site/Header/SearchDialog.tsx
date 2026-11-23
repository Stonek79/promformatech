"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { Input } from "@/components/ui/Field/Field";
import { Icon } from "@/components/ui/Icon/Icon";
import { CONTENT_LIMITS, ROUTES } from "@/config/content";
import { SEARCH } from "@/config/search";
import {
	isSearchResult,
	readSearchQuery,
	type SearchResult,
} from "@/features/content/search-query";
import { type Locale, SITE_LANGUAGE_QUERY } from "@/i18n/config";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath } from "@/i18n/site-path";
import styles from "./SearchDialog.module.css";

type Suggestions = {
	readonly results: readonly SearchResult[];
	readonly hasMore: boolean;
};

type SearchUpdate = {
	readonly query: string;
	readonly data?: Suggestions;
};

async function fetchSuggestions(
	query: string,
	locale: Locale,
	signal: AbortSignal,
) {
	const params = new URLSearchParams({
		q: query,
		[SITE_LANGUAGE_QUERY]: locale,
	});
	const response = await fetch(`${ROUTES.searchSuggestions}?${params}`, {
		signal,
	});
	if (!response.ok) {
		throw new Error("Search request failed");
	}
	const body: unknown = await response.json();
	if (
		typeof body !== "object" ||
		body === null ||
		!("hasMore" in body) ||
		typeof body.hasMore !== "boolean" ||
		!("results" in body) ||
		!Array.isArray(body.results) ||
		!body.results.every(isSearchResult)
	) {
		throw new Error("Invalid search response");
	}
	return { results: body.results, hasMore: body.hasMore };
}

export function SearchDialog({
	title,
	placeholder,
	emptyMessage,
	triggerClassName,
}: {
	readonly title: string;
	readonly placeholder: string;
	readonly emptyMessage: string;
	readonly triggerClassName: string;
}) {
	const { navigation, search } = useMessages();
	const locale = useLocale();
	const input = useRef<HTMLInputElement>(null);
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState("");
	const [update, setUpdate] = useState<SearchUpdate>();
	const query = readSearchQuery(value);
	const ready = query.length >= CONTENT_LIMITS.minimumSearchQuery;
	const result = ready && update?.query === query ? update : undefined;
	const data = result?.data;
	const failed = Boolean(result && !data);
	const searchPath = sitePath(ROUTES.search, locale);
	const count = data?.results.length ?? 0;
	let status = "";
	if (data) {
		status = count ? search.resultsShown(count) : emptyMessage;
	} else if (failed) {
		status = search.failed;
	} else if (ready) {
		status = search.loading;
	}

	useEffect(() => {
		if (!open || !ready) {
			return;
		}
		const request = new AbortController();
		const timeout = window.setTimeout(async () => {
			try {
				const data = await fetchSuggestions(query, locale, request.signal);
				if (!request.signal.aborted) {
					setUpdate({ query, data });
				}
			} catch {
				if (!request.signal.aborted) {
					setUpdate({ query });
				}
			}
		}, SEARCH.delayMs);
		return () => {
			window.clearTimeout(timeout);
			request.abort();
		};
	}, [locale, open, query, ready]);

	function changeOpen(next: boolean) {
		setOpen(next);
		if (!next) {
			setValue("");
			setUpdate(undefined);
		}
	}

	return (
		<Dialog
			title={title}
			open={open}
			onOpenChange={changeOpen}
			className={styles.popup}
			viewportClassName={styles.viewport}
			initialFocus={input}
			trigger={
				<Button
					variant="ghost"
					icon
					className={triggerClassName}
					aria-label={navigation.openSearch}
					title={title}
				>
					<Icon name="search" />
				</Button>
			}
		>
			<search>
				<form
					action={searchPath}
					className={styles.field}
					onSubmit={(event) => {
						if (!ready) {
							event.preventDefault();
						}
					}}
				>
					<Icon name="search" />
					<Input
						ref={input}
						name="q"
						type="search"
						enterKeyHint="search"
						autoComplete="off"
						aria-label={placeholder}
						placeholder={placeholder}
						maxLength={CONTENT_LIMITS.searchQuery}
						value={value}
						onChange={(event) => setValue(event.target.value)}
						className={styles.input}
					/>
				</form>
				<p role="status" className={styles.status} data-hidden={count > 0}>
					{status}
				</p>
				{data && data.results.length > 0 && (
					<ul className={styles.results}>
						{data.results.map(({ href, title, language, collection }) => (
							<li key={href}>
								<Link href={href} onNavigate={() => changeOpen(false)}>
									<span>
										<strong lang={language}>{title}</strong>
										<small>{search.types[collection]}</small>
									</span>
									<Icon name="arrow" />
								</Link>
							</li>
						))}
					</ul>
				)}
				{(failed || data?.hasMore) && (
					<Link
						href={`${searchPath}?${new URLSearchParams({ q: query })}`}
						className={styles.all}
						onNavigate={() => changeOpen(false)}
					>
						{search.all}
					</Link>
				)}
			</search>
		</Dialog>
	);
}
