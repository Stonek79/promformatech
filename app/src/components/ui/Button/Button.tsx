import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { classes } from "@/lib/classes";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "ghost";
type ButtonProps = Readonly<
	ComponentProps<"button"> & { variant?: Variant; icon?: boolean }
>;

export function Button({
	variant = "primary",
	icon,
	className,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button
			{...props}
			type={type}
			className={classes(
				styles.button,
				styles[variant],
				icon && styles.icon,
				className,
			)}
		/>
	);
}

type ButtonLinkProps = {
	readonly href: string;
	readonly children: ReactNode;
	readonly variant?: Variant;
	readonly className?: string;
};
export function ButtonLink({
	href,
	children,
	variant = "primary",
	className,
}: ButtonLinkProps) {
	return (
		<Link
			href={href}
			className={classes(styles.button, styles[variant], className)}
		>
			{children}
		</Link>
	);
}
