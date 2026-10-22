import type { ComponentProps, ReactNode } from "react";
import { classes } from "@/lib/classes";
import styles from "./Field.module.css";

export function Field({
	label,
	id,
	children,
	error,
	hint,
}: {
	readonly label: string;
	readonly id: string;
	readonly children: ReactNode;
	readonly error?: string;
	readonly hint?: string | null;
}) {
	return (
		<div className={styles.field}>
			<label htmlFor={id}>{label}</label>
			{hint && (
				<span id={`${id}-hint`} className={styles.hint}>
					{hint}
				</span>
			)}
			{children}
			{error && (
				<span id={`${id}-error`} className={styles.error}>
					{error}
				</span>
			)}
		</div>
	);
}

export function fieldDescription(
	id: string,
	hint: string | null | undefined,
	invalid: boolean,
) {
	return (
		[hint && `${id}-hint`, invalid && `${id}-error`]
			.filter(Boolean)
			.join(" ") || undefined
	);
}

export function Input({
	className,
	...props
}: Readonly<ComponentProps<"input">>) {
	return <input {...props} className={classes(styles.control, className)} />;
}

export function Textarea({
	className,
	...props
}: Readonly<ComponentProps<"textarea">>) {
	return (
		<textarea
			{...props}
			className={classes(styles.control, styles.textarea, className)}
		/>
	);
}
