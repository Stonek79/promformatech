import { classes } from "@/lib/classes";
import styles from "./Skeleton.module.css";

export function Skeleton({ className }: { readonly className?: string }) {
	return (
		<div aria-hidden="true" className={classes(styles.skeleton, className)} />
	);
}
