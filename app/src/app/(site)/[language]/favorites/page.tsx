import { Heading, Section } from "@/components/ui/Layout/Layout";
import { FavoritesView } from "@/features/favorites/FavoritesView";
import styles from "@/features/favorites/favorites.module.css";
import { getMessages } from "@/i18n/messages";
import { getSiteLocale } from "@/i18n/site-server";

export async function generateMetadata() {
	const { favorites } = getMessages(await getSiteLocale());
	return { title: favorites.title, robots: { index: false, follow: true } };
}

export default async function FavoritesPage() {
	const { favorites } = getMessages(await getSiteLocale());
	return (
		<Section className={styles.page}>
			<Heading as="h1">{favorites.title}</Heading>
			<FavoritesView />
		</Section>
	);
}
