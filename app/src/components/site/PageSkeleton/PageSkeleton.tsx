import { Container } from "@/components/ui/Layout/Layout";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import styles from "./PageSkeleton.module.css";

export function PageSkeleton({ locale }: { readonly locale: Locale }) {
	const { common: messages } = getMessages(locale);
	return (
		<div
			role="status"
			aria-label={messages.loadingLabel}
			className={styles.page}
		>
			<span className={styles.label}>{messages.loading}</span>
			<Skeleton className={styles.title} />
			<Skeleton className={styles.text} />
			<Skeleton className={styles.panel} />
			<div className={styles.columns}>
				<Skeleton className={styles.card} />
				<Skeleton className={styles.card} />
				<Skeleton className={styles.card} />
			</div>
		</div>
	);
}

export function ShellSkeleton({ locale }: { readonly locale: Locale }) {
	return (
		<main id="main-content">
			<Container>
				<div className={styles.header} aria-hidden="true">
					<Skeleton className={styles.logo} />
					<Skeleton className={styles.control} />
				</div>
				<PageSkeleton locale={locale} />
			</Container>
		</main>
	);
}
