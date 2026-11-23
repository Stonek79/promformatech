"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon/Icon";
import { ROUTES } from "@/config/content";
import { useLocale, useMessages } from "@/i18n/MessagesProvider";
import { sitePath } from "@/i18n/site-path";
import styles from "./favorites.module.css";
import { useFavoriteIDs } from "./store";

export function FavoriteLink() {
	const { favorites } = useMessages();
	const locale = useLocale();
	const count = useFavoriteIDs()?.length ?? 0;
	return (
		<Link
			href={sitePath(ROUTES.favorites, locale)}
			className={styles.headerLink}
			aria-label={favorites.title}
			title={favorites.title}
		>
			<Icon name="heart" />
			<span className={styles.headerText}>{favorites.title}</span>
			{count > 0 && (
				<span className={styles.count} aria-hidden="true">
					{count}
				</span>
			)}
		</Link>
	);
}
