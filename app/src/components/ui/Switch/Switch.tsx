import type { ReactNode } from "react";
import { classes } from "@/lib/classes";
import styles from "./Switch.module.css";

type Props = {
	readonly checked: boolean;
	readonly label: string;
	readonly hint: string;
	readonly children: ReactNode;
	readonly className?: string;
	readonly onCheckedChange: (checked: boolean) => void;
};

export function Switch({
	checked,
	label,
	hint,
	children,
	className,
	onCheckedChange,
}: Props) {
	return (
		<button
			type="button"
			role="switch"
			aria-label={label}
			aria-checked={checked}
			title={hint}
			className={classes(styles.switch, className)}
			onClick={() => onCheckedChange(!checked)}
		>
			<span className={styles.track} aria-hidden="true">
				<span className={styles.thumb}>{children}</span>
			</span>
		</button>
	);
}
