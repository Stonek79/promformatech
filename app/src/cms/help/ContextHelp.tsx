import { adminHelpURL, type HelpTopic } from "@/config/help";
import { helpArticles } from "./articles";
import styles from "./help.module.css";

export function ContextHelp({ topic }: { readonly topic: HelpTopic }) {
	return (
		<aside className={styles.context} aria-label="Как работать с разделом">
			<p>{helpArticles[topic].summary}</p>
			<a href={adminHelpURL(topic)} target="_blank" rel="noopener noreferrer">
				Пошаговая инструкция — в новой вкладке ↗
			</a>
		</aside>
	);
}
