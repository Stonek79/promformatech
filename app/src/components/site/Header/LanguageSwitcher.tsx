"use client";

import { Popover } from "@base-ui/react/popover";
import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { SITE_LANGUAGES } from "@/i18n/config";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath } from "@/i18n/site-path";
import styles from "./LanguageSwitcher.module.css";

export function LanguageSwitcher() {
	const locale = useLocale();
	const { navigation: messages } = useMessages();
	const [route, setRoute] = useState("");
	const current = SITE_LANGUAGES[locale];

	function readCurrentRoute(open: boolean) {
		if (open) {
			const { pathname, search, hash } = window.location;
			setRoute(`${pathname}${search}${hash}`);
		}
	}

	return (
		<Popover.Root onOpenChange={readCurrentRoute}>
			<Popover.Trigger
				render={
					<Button
						variant="ghost"
						className={styles.trigger}
						aria-label={messages.changeLanguage(current.name)}
					>
						<Icon name="globe" />
						<span aria-hidden="true">{current.code}</span>
					</Button>
				}
			/>
			<Popover.Portal>
				<Popover.Positioner align="end" className={styles.positioner}>
					<Popover.Popup className={styles.popup} initialFocus>
						<Popover.Title className={styles.title}>
							{messages.languages}
						</Popover.Title>
						<ul className={styles.list}>
							{Object.entries(SITE_LANGUAGES).map(([key, language]) => {
								const target = key as keyof typeof SITE_LANGUAGES;
								return (
									<li key={target}>
										<a
											href={sitePath(route, target)}
											lang={target}
											hrefLang={target}
											aria-current={locale === target ? "true" : undefined}
										>
											{language.name}
										</a>
									</li>
								);
							})}
						</ul>
					</Popover.Popup>
				</Popover.Positioner>
			</Popover.Portal>
		</Popover.Root>
	);
}
