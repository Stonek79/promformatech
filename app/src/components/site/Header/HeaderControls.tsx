"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { Input } from "@/components/ui/Field/Field";
import { Icon } from "@/components/ui/Icon/Icon";
import { CONTENT_LIMITS, ROUTES } from "@/config/content";
import { SiteAppearance } from "@/features/appearance/SiteAppearance";
import { useMessages } from "@/i18n/MessagesProvider";
import styles from "./Header.module.css";

type Props = {
	readonly navigation: readonly {
		readonly label: string;
		readonly url: string;
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
	const [menuOpen, setMenuOpen] = useState(false);
	return (
		<div className={styles.controls}>
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
					<form action={ROUTES.search} className={styles.search}>
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
									key={item.url}
									href={item.url}
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
