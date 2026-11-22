import Link from "next/link";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { COLLECTIONS, CONTENT_LIMITS } from "@/config/content";
import styles from "@/features/content/components/pages.module.css";
import { publishedSearch } from "@/features/content/queries";
import { readSettings } from "@/features/content/read";
import { getViewer } from "@/features/content/viewer";
import { getMessages } from "@/i18n/messages";
import { interfaceLabels } from "@/i18n/site-copy";
import { sitePath } from "@/i18n/site-path";
import { getSiteLocale } from "@/i18n/site-server";
import { materialPath, pagePath } from "@/lib/urls";

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
	const query = (typeof q === "string" ? q : "")
		.trim()
		.slice(0, CONTENT_LIMITS.searchQuery);
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
					{matches.map(({ collection, doc, language }) => {
						const path =
							collection === COLLECTIONS.pages
								? pagePath(doc.slug)
								: materialPath(collection, doc.slug);
						return (
							<li key={`${collection}-${doc.id}`} lang={language}>
								<Link href={sitePath(path, locale)}>
									<h2>{doc.title}</h2>
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</Section>
	);
}
