"use client";

import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { FAVORITES } from "@/config/favorites";
import { useMessages } from "@/i18n/MessagesProvider";
import { classes } from "@/lib/classes";
import styles from "./favorites.module.css";
import { toggleFavorite, useFavoriteIDs } from "./store";

export function FavoriteToggle({
	id,
	title,
	position,
}: {
	readonly id: number;
	readonly title: string;
	readonly position?: "card" | "detail";
}) {
	const { favorites } = useMessages();
	const ids = useFavoriteIDs();
	const saved = ids?.includes(id) ?? false;
	const limitReached = ids?.length === FAVORITES.maxProducts && !saved;
	const label = saved ? favorites.saved : favorites.add;
	return (
		<Button
			variant="secondary"
			icon={!position || position === "card"}
			className={classes(
				styles.toggle,
				position === "card" && styles.cardToggle,
			)}
			aria-label={favorites.toggle(title)}
			aria-pressed={saved}
			disabled={!ids || limitReached}
			title={label}
			onClick={() => toggleFavorite(id)}
		>
			<Icon name="heart" />
			{position === "detail" && (
				<span className={styles.toggleLabel}>{label}</span>
			)}
		</Button>
	);
}
