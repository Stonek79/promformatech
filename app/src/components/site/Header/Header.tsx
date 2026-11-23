import Link from "next/link";
import { BrandMark } from "@/components/site/BrandMark/BrandMark";
import { Container } from "@/components/ui/Layout/Layout";
import { ROUTES } from "@/config/content";
import type { SiteSettingsView } from "@/features/content/site-settings";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import {
	interfaceLabels,
	navigationLink,
	siteBrandName,
} from "@/i18n/site-copy";
import { sitePath } from "@/i18n/site-path";
import { phoneHref } from "@/lib/urls";
import styles from "./Header.module.css";
import { HeaderControls } from "./HeaderControls";

export function Header({
	settings,
	locale,
}: {
	readonly settings: SiteSettingsView;
	readonly locale: Locale;
}) {
	const { navigation: messages } = getMessages(locale);
	const labels = interfaceLabels(settings, locale);
	const navigation = settings.navigation
		.filter((item) => item.visible !== false)
		.flatMap((item) => navigationLink(item, locale));
	const phone = settings.phone
		? { label: settings.phone, href: phoneHref(settings.phone) }
		: undefined;
	return (
		<header className={styles.header}>
			<Container>
				<div className={styles.top}>
					<Link
						href={sitePath(ROUTES.home, locale)}
						className={styles.logo}
						aria-label={messages.homeLabel(
							siteBrandName(settings.companyName, locale),
						)}
					>
						<BrandMark
							company={settings.companyName}
							logo={settings.logo}
							fallbackLogo={settings.footerLogo}
							locale={locale}
							priority
						/>
					</Link>
					<div className={styles.contacts}>
						{phone && <a href={phone.href}>{phone.label}</a>}
						<HeaderControls
							navigation={navigation}
							searchTitle={labels.searchTitle}
							searchPlaceholder={labels.searchPlaceholder}
							emptySearch={labels.emptySearch}
							phone={phone}
						/>
					</div>
				</div>
				<nav className={styles.navigation} aria-label={messages.mainMenu}>
					{navigation.map((item) => (
						<Link key={item.id || item.url} href={item.url} lang={item.lang}>
							{item.label}
						</Link>
					))}
				</nav>
			</Container>
		</header>
	);
}
