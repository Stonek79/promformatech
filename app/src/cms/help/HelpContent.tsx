import Link from "next/link";
import { ROUTES } from "@/config/content";
import { ADMIN_HELP, HELP_TOPICS } from "@/config/help";
import { helpArticles } from "./articles";
import styles from "./help.module.css";

export function HelpContent() {
	return (
		<main className={styles.guide}>
			<header className={styles.intro}>
				<p className={styles.eyebrow}>Справочник по наполнению сайта</p>
				<h1>{ADMIN_HELP.title}</h1>
				<p>
					Первый раз в админке? Начните с инструкции ниже или выберите свою
					задачу. Справочник всегда доступен в боковом меню.
				</p>
				<a className={styles.startLink} href={`#${HELP_TOPICS.publication}`}>
					Начать: изменить текст и проверить перед публикацией
				</a>
				<Link href={ROUTES.admin}>Вернуться к управлению сайтом</Link>
			</header>
			<nav
				id={ADMIN_HELP.contentsID}
				className={styles.contents}
				aria-label="Темы справочника"
			>
				<h2>Что вы хотите сделать?</h2>
				<ul>
					{Object.values(HELP_TOPICS).map((topic) => (
						<li key={topic}>
							<a href={`#${topic}`}>{helpArticles[topic].title}</a>
						</li>
					))}
				</ul>
			</nav>
			{Object.values(HELP_TOPICS).map((topic) => {
				const article = helpArticles[topic];
				return (
					<section key={topic} id={topic} className={styles.article}>
						<h2>{article.title}</h2>
						<p>{article.summary}</p>
						{article.steps && (
							<ol>
								{article.steps.map((step) => (
									<li key={step}>{step}</li>
								))}
							</ol>
						)}
						{article.details && (
							<dl>
								{article.details.map((detail) => (
									<div key={detail.title}>
										<dt>{detail.title}</dt>
										<dd>{detail.text}</dd>
									</div>
								))}
							</dl>
						)}
						{article.note && <p className={styles.note}>{article.note}</p>}
						<div className={styles.links}>
							{article.links?.map((link) => (
								<Link href={link.href} key={link.href}>
									{link.label}
								</Link>
							))}
							<a href={`#${ADMIN_HELP.contentsID}`}>К списку тем ↑</a>
						</div>
					</section>
				);
			})}
		</main>
	);
}
