"use client";

import { Dialog as Primitive } from "@base-ui/react/dialog";
import type { CSSProperties, ReactElement, ReactNode, RefObject } from "react";
import { useMessages } from "@/i18n/MessagesProvider";
import { classes } from "@/lib/classes";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import styles from "./Dialog.module.css";

type Props = {
	readonly title: string;
	readonly titleLanguage?: string;
	readonly trigger: ReactElement;
	readonly children: ReactNode;
	readonly open?: boolean;
	readonly onOpenChange?: (open: boolean) => void;
	readonly className?: string;
	readonly viewportClassName?: string;
	readonly initialFocus?: RefObject<HTMLElement | null>;
	readonly style?: CSSProperties;
};

export function Dialog({
	title,
	titleLanguage,
	trigger,
	children,
	open,
	onOpenChange,
	className,
	viewportClassName,
	initialFocus,
	style,
}: Props) {
	const { common: messages } = useMessages();
	return (
		<Primitive.Root open={open} onOpenChange={onOpenChange}>
			<Primitive.Trigger render={trigger} />
			<Primitive.Portal>
				<Primitive.Backdrop className={styles.backdrop} />
				<Primitive.Viewport
					className={classes(styles.viewport, viewportClassName)}
				>
					<Primitive.Popup
						className={classes(styles.popup, className)}
						initialFocus={initialFocus}
						style={style}
					>
						<div className={styles.header}>
							<Primitive.Title className={styles.title} lang={titleLanguage}>
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
