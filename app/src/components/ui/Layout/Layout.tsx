import type { ComponentProps, ReactNode } from "react";
import { classes } from "@/lib/classes";
import styles from "./Layout.module.css";

export function Container({
	className,
	...props
}: Readonly<ComponentProps<"div">>) {
	return <div {...props} className={classes(styles.container, className)} />;
}

export function Section({
	children,
	className,
	...props
}: Readonly<ComponentProps<"section">>) {
	return (
		<section {...props} className={classes(styles.section, className)}>
			{children}
		</section>
	);
}

export function Heading({
	children,
	as: Tag = "h2",
	className,
}: {
	readonly children: ReactNode;
	readonly as?: "h1" | "h2" | "h3";
	readonly className?: string;
}) {
	return <Tag className={classes(styles.heading, className)}>{children}</Tag>;
}

export function Stack({
	children,
	className,
}: {
	readonly children: ReactNode;
	readonly className?: string;
}) {
	return <div className={classes(styles.stack, className)}>{children}</div>;
}
