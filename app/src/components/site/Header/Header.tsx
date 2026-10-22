import Link from "next/link";
import { Container } from "@/components/ui/Layout/Layout";
import { ROUTES } from "@/config/content";
import { IMAGE_SIZES } from "@/config/image";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { getMessages } from "@/i18n/messages";
import { isSafeHref, phoneHref } from "@/lib/urls";
import type { SiteSetting } from "@/payload-types";
import styles from "./Header.module.css";
import { HeaderControls } from "./HeaderControls";

export function Header({ settings }: { readonly settings: SiteSetting }) {
	const { navigation: messages } = getMessages();
	const navigation = (settings.navigation || [])
		.filter((item) => item.visible !== false && isSafeHref(item.url))
		.map((item) => ({ label: item.label, url: item.url || ROUTES.home }));
	return (
		<header className={styles.header}>
			<Container>
				<div className={styles.top}>
					<Link
						href={ROUTES.home}
						className={styles.logo}
						aria-label={messages.homeLabel(settings.companyName)}
					>
						{typeof settings.logo === "object" && settings.logo ? (
							<MediaImage
								sizes={IMAGE_SIZES.logo}
								asset={mediaView(settings.logo)}
								alt={settings.companyName}
								priority
							/>
						) : (
							settings.companyName
						)}
					</Link>
					<div className={styles.contacts}>
						{settings.phone && (
							<a href={phoneHref(settings.phone)}>{settings.phone}</a>
						)}
						<HeaderControls
							navigation={navigation}
							searchTitle={settings.labels?.searchTitle || messages.search}
							searchPlaceholder={
								settings.labels?.searchPlaceholder || messages.searchPlaceholder
							}
							searchButton={
								settings.labels?.searchButton || messages.searchButton
							}
						/>
					</div>
				</div>
				<nav className={styles.navigation} aria-label={messages.mainMenu}>
					{navigation.map((item) => (
						<Link key={item.url} href={item.url}>
							{item.label}
						</Link>
					))}
				</nav>
			</Container>
		</header>
	);
}
