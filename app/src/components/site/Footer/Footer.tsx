import { AddressMapLink } from "@/components/site/AddressMapLink";
import { BrandMark } from "@/components/site/BrandMark/BrandMark";
import { Icon } from "@/components/ui/Icon/Icon";
import { Container, Heading } from "@/components/ui/Layout/Layout";
import { ANCHORS } from "@/config/content";
import { contactMap } from "@/features/content/contact-map";
import type { SiteSettingsView } from "@/features/content/site-settings";
import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import { navigationLink } from "@/i18n/site-copy";
import { phoneHref } from "@/lib/urls";
import styles from "./Footer.module.css";

export function Footer({
	settings,
	locale,
}: {
	readonly settings: SiteSettingsView;
	readonly locale: Locale;
}) {
	const { common: messages } = getMessages(locale);
	const copy = settings.footer;
	const office = settings.locations.find((location) => location.showInFooter);
	const map = office && contactMap(office);
	const links = settings.footerLinks.flatMap((link) =>
		navigationLink(link, locale),
	);
	return (
		<footer id={ANCHORS.contact} className={styles.footer}>
			<Container>
				<Heading lang={copy.title.value ? copy.title.lang : locale}>
					{copy.title.value || messages.contacts}
				</Heading>
				<div className={styles.main}>
					<address className={styles.address}>
						{settings.phone && (
							<a href={phoneHref(settings.phone)} title={settings.phone}>
								<Icon name="phone" />
								<span className={styles.contactLine}>{settings.phone}</span>
							</a>
						)}
						{settings.email && (
							<a href={`mailto:${settings.email}`} title={settings.email}>
								<Icon name="mail" />
								<span className={styles.contactLine}>{settings.email}</span>
							</a>
						)}
						{map && office ? (
							<AddressMapLink
								address={map.address}
								href={map.href}
								locale={office.addressLanguage}
								className={styles.addressLink}
							/>
						) : office?.address ? (
							<p lang={office.addressLanguage}>{office.address}</p>
						) : null}
						{copy.hours.value && (
							<p lang={copy.hours.lang}>{copy.hours.value}</p>
						)}
					</address>
					<div className={styles.logo}>
						<BrandMark
							company={settings.companyName}
							logo={settings.logo}
							fallbackLogo={settings.footerLogo}
							locale={locale}
						/>
					</div>
				</div>
				<div className={styles.bottom}>
					{copy.copyright.value && (
						<p lang={copy.copyright.lang}>{copy.copyright.value}</p>
					)}
					{links.length > 0 && (
						<nav aria-label={messages.footerNavigation}>
							{links.map((link) => (
								<a key={link.id || link.url} href={link.url} lang={link.lang}>
									{link.label}
								</a>
							))}
						</nav>
					)}
				</div>
			</Container>
		</footer>
	);
}
