"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Dialog } from "@/components/ui/Dialog/Dialog";
import { Icon } from "@/components/ui/Icon/Icon";
import { SiteAppearance } from "@/features/appearance/SiteAppearance";
import type { Locale } from "@/i18n/config";
import { useMessages } from "@/i18n/MessagesProvider";
import styles from "./Header.module.css";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchDialog } from "./SearchDialog";

type Props = {
	readonly navigation: readonly {
		readonly id?: string | null;
		readonly label?: string | null;
		readonly url: string;
		readonly lang: Locale;
	}[];
	readonly searchTitle: string;
	readonly searchPlaceholder: string;
	readonly emptySearch: string;
	readonly phone?: { readonly label: string; readonly href: string };
};

export function HeaderControls({
	navigation,
	searchTitle,
	searchPlaceholder,
	emptySearch,
	phone,
}: Props) {
	const { navigation: messages } = useMessages();
	const [menuOpen, setMenuOpen] = useState(false);
	return (
		<div className={styles.controls}>
			<div className={styles.quickControls}>
				<SearchDialog
					title={searchTitle}
					placeholder={searchPlaceholder}
					emptyMessage={emptySearch}
					triggerClassName={styles.headerButton}
				/>
				<div className={styles.mobileMenu}>
					<Dialog
						title={messages.menu}
						open={menuOpen}
						onOpenChange={setMenuOpen}
						trigger={
							<Button
								variant="ghost"
								icon
								className={styles.headerButton}
								aria-label={messages.openMenu}
							>
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
						{phone && (
							<a className={styles.menuPhone} href={phone.href}>
								<Icon name="phone" />
								{phone.label}
							</a>
						)}
					</Dialog>
				</div>
			</div>
			<div className={styles.appearance}>
				<LanguageSwitcher />
				<SiteAppearance />
			</div>
		</div>
	);
}
