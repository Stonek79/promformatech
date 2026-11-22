"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { Input } from "@/components/ui/Field/Field";
import { Icon } from "@/components/ui/Icon/Icon";
import { CONTENT_LIMITS, ROUTES } from "@/config/content";
import { SiteAppearance } from "@/features/appearance/SiteAppearance";
import type { Locale } from "@/i18n/config";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath } from "@/i18n/site-path";
import styles from "./Header.module.css";
import { LanguageSwitcher } from "./LanguageSwitcher";

type Props = {
	readonly navigation: readonly {
		readonly id?: string | null;
		readonly label?: string | null;
		readonly url: string;
		readonly lang: Locale;
	}[];
	readonly searchTitle: string;
	readonly searchPlaceholder: string;
	readonly searchButton: string;
};

export function HeaderControls({
	navigation,
	searchTitle,
	searchPlaceholder,
	searchButton,
}: Props) {
	const { navigation: messages } = useMessages();
	const locale = useLocale();
	const [menuOpen, setMenuOpen] = useState(false);
	return (
		<div className={styles.controls}>
			<div className={styles.language}>
				<LanguageSwitcher />
			</div>
			<div className={styles.quickControls}>
				<Dialog
					title={searchTitle}
					trigger={
						<Button
							variant="secondary"
							icon
							className={styles.searchTrigger}
							aria-label={messages.openSearch}
							title={messages.searchTitle}
						>
							<Icon name="search" />
						</Button>
					}
				>
					<form
						action={sitePath(ROUTES.search, locale)}
						className={styles.search}
					>
						<label htmlFor="site-search">{searchPlaceholder}</label>
						<Input
							id="site-search"
							name="q"
							type="search"
							placeholder={searchPlaceholder}
							maxLength={CONTENT_LIMITS.searchQuery}
							required
						/>
						<Button type="submit">{searchButton}</Button>
					</form>
				</Dialog>
				<div className={styles.mobileMenu}>
					<Dialog
						title={messages.menu}
						open={menuOpen}
						onOpenChange={setMenuOpen}
						trigger={
							<Button variant="ghost" icon aria-label={messages.openMenu}>
								<Icon name="menu" />
							</Button>
						}
					>
						<nav
							className={styles.mobileNavigation}
							aria-label={messages.mobileMenu}
						>
							{navigation.map((item) => (
								<Link
									key={item.id || item.url}
									href={item.url}
									lang={item.lang}
									onClick={() => setMenuOpen(false)}
								>
									{item.label}
								</Link>
							))}
						</nav>
					</Dialog>
				</div>
			</div>
			<div className={styles.appearance}>
				<SiteAppearance />
			</div>
		</div>
	);
}
