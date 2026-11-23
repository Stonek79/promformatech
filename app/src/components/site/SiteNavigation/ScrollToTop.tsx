"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { useMessages } from "@/i18n/MessagesProvider";
import styles from "./SiteNavigation.module.css";

const IDLE_TIME = 2400;

export function ScrollToTop() {
	const { navigation } = useMessages();
	const button = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const control = button.current;
		if (!control) {
			return;
		}
		let timeout = 0;
		function update() {
			if (!control) {
				return;
			}
			const pastScreen = window.scrollY >= window.innerHeight;
			window.clearTimeout(timeout);
			control.hidden = !pastScreen;
			control.dataset.active = String(pastScreen);
			if (pastScreen) {
				timeout = window.setTimeout(() => {
					control.dataset.active = "false";
				}, IDLE_TIME);
			}
		}
		update();
		window.addEventListener("scroll", update, { passive: true });
		return () => {
			window.removeEventListener("scroll", update);
			window.clearTimeout(timeout);
		};
	}, []);

	return (
		<Button
			ref={button}
			variant="secondary"
			icon
			hidden
			className={styles.toTop}
			aria-label={navigation.toTop}
			title={navigation.toTop}
			onClick={() => {
				document.getElementById("main-content")?.focus({ preventScroll: true });
				window.scrollTo({ top: 0 });
			}}
		>
			<Icon name="up" />
		</Button>
	);
}
