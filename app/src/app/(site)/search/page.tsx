import Link from "next/link";
import { Heading, Section } from "@/components/ui/Layout/Layout";
import { COLLECTIONS, CONTENT_LIMITS } from "@/config/content";
import styles from "@/features/content/components/pages.module.css";
import { publishedSearch } from "@/features/content/queries";
import { readSettings } from "@/features/content/read";
import { getViewer } from "@/features/content/viewer";
import { materialPath, pagePath } from "@/lib/urls";

export const metadata = {
	title: "Поиск",
	robots: { index: false, follow: false },
};

export default async function SearchPage({
	searchParams,
}: {
	readonly searchParams: Promise<{ q?: string }>;
}) {
	const query = String((await searchParams).q || "")
		.trim()
		.slice(0, CONTENT_LIMITS.searchQuery);
	const viewer = await getViewer(),
		settings = await readSettings(viewer);
	const matches = await publishedSearch(query);
	return (
		<Section>
			<Heading as="h1">
				{settings.labels?.searchTitle}: {query}
			</Heading>
			{!matches.length ? (
				<p>{settings.labels?.emptySearch}</p>
			) : (
				<ul className={styles.searchResults}>
					{matches.map(({ collection, doc }) => (
						<li key={`${collection}-${doc.id}`}>
							<Link
								href={
									collection === COLLECTIONS.pages
										? pagePath(doc.slug)
										: materialPath(collection, doc.slug)
								}
							>
								<h2>{doc.title}</h2>
							</Link>
						</li>
					))}
				</ul>
			)}
		</Section>
	);
}
