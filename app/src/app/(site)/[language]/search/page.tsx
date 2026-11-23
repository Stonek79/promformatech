import Link from "next/link";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import styles from "@/features/content/components/pages.module.css";
import { readSettings } from "@/features/content/read";
import { publishedSearch } from "@/features/content/search";
import { readSearchQuery } from "@/features/content/search-query";
import { getViewer } from "@/features/content/viewer";
import { getMessages } from "@/i18n/messages";
import { interfaceLabels } from "@/i18n/site-copy";
import { getSiteLocale } from "@/i18n/site-server";

export async function generateMetadata() {
	const { navigation } = getMessages(await getSiteLocale());
	return { title: navigation.search, robots: { index: false, follow: false } };
}

export default async function SearchPage({
	searchParams,
}: {
	readonly searchParams: Promise<{ q?: string | string[] }>;
}) {
	const [{ q }, locale] = await Promise.all([searchParams, getSiteLocale()]);
	const query = readSearchQuery(q);
	const viewer = await getViewer(locale);
	const [settings, matches] = await Promise.all([
		readSettings(viewer),
		publishedSearch(query, locale),
	]);
	const labels = interfaceLabels(settings, locale);
	const { search } = getMessages(locale);
	return (
		<Section>
			<Heading as="h1">
				{search.resultsTitle(labels.searchTitle, query)}
			</Heading>
			{!matches.length ? (
				<p>{labels.emptySearch}</p>
			) : (
				<ul className={styles.searchResults}>
					{matches.map(({ href, title, language }) => (
						<li key={href} lang={language}>
							<Link href={href}>
								<h2>{title}</h2>
							</Link>
						</li>
					))}
				</ul>
			)}
		</Section>
	);
}
