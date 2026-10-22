import { Icon } from "@/components/ui/Icon/Icon";
import { Container, Heading } from "@/components/ui/Layout/Layout";
import { IMAGE_SIZES } from "@/config/image";
import { MediaImage } from "@/features/media/MediaView";
import { mediaView } from "@/features/media/view-model";
import { getMessages } from "@/i18n/messages";
import { isSafeHref, phoneHref } from "@/lib/urls";
import type { SiteSetting } from "@/payload-types";
import styles from "./Footer.module.css";

export function Footer({ settings }: { readonly settings: SiteSetting }) {
	const { common: messages } = getMessages();
	return (
		<footer className={styles.footer}>
			<Container>
				<Heading>{settings.labels?.contactTitle || messages.contacts}</Heading>
				<div className={styles.main}>
					<address className={styles.address}>
						{settings.phone && (
							<a href={phoneHref(settings.phone)}>
								<Icon name="phone" />
								{settings.phone}
							</a>
						)}
						{settings.email && (
							<a href={`mailto:${settings.email}`}>
								<Icon name="mail" />
								{settings.email}
							</a>
						)}
						{settings.address && (
							<p>
								<Icon name="location" />
								{settings.address}
							</p>
						)}
						{settings.hours && <p>{settings.hours}</p>}
					</address>
					<div className={styles.logo}>
						{typeof settings.footerLogo === "object" && settings.footerLogo ? (
							<MediaImage
								sizes={IMAGE_SIZES.logo}
								asset={mediaView(settings.footerLogo)}
								alt={settings.companyName}
							/>
						) : (
							settings.companyName
						)}
					</div>
				</div>
				<div className={styles.bottom}>
					<p>{settings.copyright}</p>
					<nav aria-label={messages.legalNavigation}>
						{settings.footerLinks?.map(
							(link) =>
								isSafeHref(link.url) && (
									<a key={link.id} href={link.url}>
										{link.label}
									</a>
								),
						)}
					</nav>
				</div>
			</Container>
		</footer>
	);
}
