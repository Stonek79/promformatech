"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import { ROUTES } from "@/config/content";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath, splitSitePath } from "@/i18n/site-path";
import styles from "./SiteNavigation.module.css";

type ScrollPosition = {
	readonly url: string;
	readonly top: number;
	readonly anchor?: {
		readonly href: string;
		readonly index: number;
		readonly offset: number;
	};
};

const CATALOGS = [ROUTES.products, ROUTES.services, ROUTES.projects];
const SERVICE_ROUTES = [ROUTES.admin, ROUTES.api, ROUTES.media, ROUTES.preview];
const RESTORE_TIMEOUT = 2000;

function address(url: Location | URL) {
	return url.pathname + url.search;
}

function updateHistory(data: { pfFrom?: string; pfPosition?: ScrollPosition }) {
	window.history.replaceState({ ...window.history.state, ...data }, "");
}

function unmodified(
	event: Pick<
		MouseEvent,
		"button" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey"
	>,
) {
	return (
		event.button === 0 &&
		!event.ctrlKey &&
		!event.metaKey &&
		!event.altKey &&
		!event.shiftKey
	);
}

function destination(event: globalThis.MouseEvent) {
	if (!unmodified(event) || !(event.target instanceof Element)) {
		return null;
	}
	const link = event.target.closest<HTMLAnchorElement>("a[href]");
	if (
		!link ||
		link.target ||
		link.download ||
		link.hasAttribute("data-site-back")
	) {
		return null;
	}
	const url = new URL(link.href, window.location.href);
	if (
		url.origin !== window.location.origin ||
		url.hash ||
		address(url) === address(window.location) ||
		SERVICE_ROUTES.some(
			(route) => url.pathname === route || url.pathname.startsWith(`${route}/`),
		)
	) {
		return null;
	}
	return { url: address(url), link };
}

function cardLinks(href: string) {
	return [
		...document.querySelectorAll<HTMLAnchorElement>(
			`a[data-return-card][href="${CSS.escape(href)}"]`,
		),
	];
}

function cardPosition(link: HTMLAnchorElement) {
	const href = link.getAttribute("href");
	if (!href || !link.hasAttribute("data-return-card")) {
		return undefined;
	}
	return {
		href,
		index: cardLinks(href).indexOf(link),
		offset: link.getBoundingClientRect().top,
	};
}

function restorePosition(position: ScrollPosition) {
	const main = document.getElementById("main-content");
	if (!main) {
		return;
	}
	function restore(force = false) {
		const anchor =
			position.anchor && cardLinks(position.anchor.href)[position.anchor.index];
		if (
			!force &&
			((position.anchor && !anchor) ||
				(!anchor &&
					document.documentElement.scrollHeight <
						position.top + window.innerHeight - 1))
		) {
			return;
		}
		const top =
			anchor && position.anchor
				? window.scrollY +
					anchor.getBoundingClientRect().top -
					position.anchor.offset
				: position.top;
		window.scrollTo({ top, behavior: "instant" });
		anchor?.focus({ preventScroll: true });
		stop();
	}

	const observer = new ResizeObserver(() => restore());
	const frame = requestAnimationFrame(() => restore());
	const deadline = window.setTimeout(() => restore(true), RESTORE_TIMEOUT);
	function stop() {
		observer.disconnect();
		cancelAnimationFrame(frame);
		window.clearTimeout(deadline);
	}
	observer.observe(main);
	return stop;
}

export function BackNavigation() {
	const router = useRouter();
	const pathname = usePathname();
	const locale = useLocale();
	const { navigation } = useMessages();
	const pending = useRef<{ readonly from: string; readonly to: string } | null>(
		null,
	);
	const path = splitSitePath(pathname).pathname;
	const fallback =
		CATALOGS.find((route) => path.startsWith(`${route}/`)) ?? ROUTES.home;

	useEffect(() => {
		let stopRestoring: ReturnType<typeof restorePosition>;
		function remember(event: globalThis.MouseEvent) {
			const target = destination(event);
			if (!target) {
				return;
			}
			const from = address(window.location);
			const anchor = cardPosition(target.link);
			updateHistory({ pfPosition: { url: from, top: window.scrollY, anchor } });
			pending.current = { from, to: target.url };
		}

		function onPop(event: PopStateEvent) {
			pending.current = null;
			stopRestoring?.();
			const position: ScrollPosition | undefined = event.state?.pfPosition;
			if (position?.url === address(window.location)) {
				stopRestoring = restorePosition(position);
			}
		}

		document.addEventListener("click", remember, true);
		window.addEventListener("popstate", onPop);
		return () => {
			document.removeEventListener("click", remember, true);
			window.removeEventListener("popstate", onPop);
			stopRestoring?.();
		};
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: The visible browser URL is read after each Next.js route transition.
	useEffect(() => {
		const current = address(window.location);
		if (pending.current?.to === current) {
			updateHistory({ pfFrom: pending.current.from });
			pending.current = null;
		}
	}, [pathname]);

	function goBack(event: MouseEvent<HTMLAnchorElement>) {
		if (!unmodified(event) || !window.history.state?.pfFrom) {
			return;
		}
		event.preventDefault();
		router.back();
	}

	if (path === ROUTES.home) {
		return null;
	}
	return (
		<Link
			className={styles.back}
			href={sitePath(fallback, locale)}
			onClick={goBack}
			data-site-back
		>
			<Icon name="back" />
			{navigation.back}
		</Link>
	);
}
