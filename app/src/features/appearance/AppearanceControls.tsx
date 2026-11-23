"use client";

import { Button } from "@/components/ui/Button/Button";
import { Icon } from "@/components/ui/Icon/Icon";
import { Switch } from "@/components/ui/Switch/Switch";
import {
	NEXT_TEXT_SIZE,
	type TextSize,
	THEMES,
	type ThemePreference,
} from "@/config/appearance";
import { useMessages } from "@/i18n/MessagesProvider";
import styles from "./appearance.module.css";
import { useDarkTheme } from "./useDarkTheme";

type Props = {
	readonly theme: ThemePreference;
	readonly size: TextSize;
	readonly onThemeChange: (theme: ThemePreference) => void;
	readonly onSizeChange: (size: TextSize) => void;
};

export function AppearanceControls({
	theme,
	size,
	onThemeChange,
	onSizeChange,
}: Props) {
	const { appearance: messages } = useMessages();
	const dark = useDarkTheme(theme);
	const nextSize = NEXT_TEXT_SIZE[size];
	const sizeHint = messages.sizeHint(
		messages.sizes[size],
		messages.sizes[nextSize],
	);
	return (
		<div className={styles.controls}>
			<Switch
				className={styles.themeSwitch}
				checked={dark}
				label={messages.darkTheme}
				hint={dark ? messages.useLightTheme : messages.useDarkTheme}
				onCheckedChange={(checked) =>
					onThemeChange(checked ? THEMES.dark : THEMES.light)
				}
			>
				<span className={styles.sun}>
					<Icon name="sun" />
				</span>
				<span className={styles.moon}>
					<Icon name="moon" />
				</span>
			</Switch>
			<Button
				variant="secondary"
				icon
				className={styles.sizeButton}
				data-size={size}
				aria-label={messages.sizeAction(messages.sizes[size])}
				title={sizeHint}
				onClick={() => onSizeChange(nextSize)}
			>
				<Icon name="textSize" />
			</Button>
		</div>
	);
}
