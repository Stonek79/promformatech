import type { ReactNode } from "react";
import { classes } from "@/lib/classes";
import styles from "./Badge.module.css";

type Tone = "neutral" | "success" | "danger";
export function Badge({
	children,
	tone = "neutral",
}: {
	readonly children: ReactNode;
	readonly tone?: Tone;
}) {
	return (
		<span className={classes(styles.badge, styles[tone])}>{children}</span>
	);
}
