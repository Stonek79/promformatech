"use client";

import { Dialog as Primitive } from "@base-ui/react/dialog";
import type { ReactElement, ReactNode } from "react";
import { useMessages } from "@/i18n/MessagesProvider";
import { classes } from "@/lib/classes";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import styles from "./Dialog.module.css";

type Props = {
	readonly title: string;
	readonly trigger: ReactElement;
	readonly children: ReactNode;
	readonly open?: boolean;
	readonly onOpenChange?: (open: boolean) => void;
	readonly className?: string;
};

export function Dialog({
	title,
	trigger,
	children,
	open,
	onOpenChange,
	className,
}: Props) {
	const { common: messages } = useMessages();
	return (
		<Primitive.Root open={open} onOpenChange={onOpenChange}>
			<Primitive.Trigger render={trigger} />
			<Primitive.Portal>
				<Primitive.Backdrop className={styles.backdrop} />
				<Primitive.Viewport className={styles.viewport}>
					<Primitive.Popup className={classes(styles.popup, className)}>
						<div className={styles.header}>
							<Primitive.Title className={styles.title}>
								{title}
							</Primitive.Title>
							<Primitive.Close
								render={
									<Button variant="ghost" icon aria-label={messages.close} />
								}
							>
								<Icon name="close" />
							</Primitive.Close>
						</div>
						{children}
					</Primitive.Popup>
				</Primitive.Viewport>
			</Primitive.Portal>
		</Primitive.Root>
	);
}
