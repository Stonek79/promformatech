import { Container } from "@/components/ui/Layout/Layout";
import { Skeleton } from "@/components/ui/Skeleton/Skeleton";
import { getMessages } from "@/i18n/messages";
import styles from "./PageSkeleton.module.css";

export function PageSkeleton() {
	const { common: messages } = getMessages();
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

export function ShellSkeleton() {
	return (
		<main id="main-content">
			<Container>
				<div className={styles.header} aria-hidden="true">
					<Skeleton className={styles.logo} />
					<Skeleton className={styles.control} />
				</div>
				<PageSkeleton />
			</Container>
		</main>
	);
}
