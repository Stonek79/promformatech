import { AddressMapLink } from "@/components/site/AddressMapLink";
import { Heading } from "@/components/ui/Layout/Layout";
import { CONTACT_MAP_POSITION } from "@/config/maps";
import { contactMap } from "@/features/content/contact-map";
import type {
	ContactLocation,
	SiteSettingsView,
} from "@/features/content/site-settings";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { AddressMapPreview } from "./AddressMapPreview";
import { ContactPeople } from "./ContactPeople";
import styles from "./Contacts.module.css";

function OfficeCard({
	location,
	locale,
}: {
	readonly location: ContactLocation;
	readonly locale: Locale;
}) {
	const address = location.address?.trim();
	const map = contactMap(location);
	const preview = map?.preview ? (
		<AddressMapPreview
			address={map.address}
			addressLanguage={location.addressLanguage}
			href={map.href}
			locale={locale}
			preview={map.preview}
		/>
	) : null;
	const position = preview ? map?.position : undefined;

	return (
		<section className={styles.location} data-map-position={position}>
			<div className={styles.details}>
				{location.title && (
					<Heading as="h2" lang={location.titleLanguage}>
						{location.title}
					</Heading>
				)}
				<address className={styles.address}>
					{address && (
						<p className={styles.street} lang={location.addressLanguage}>
							{map && !preview ? (
								<AddressMapLink
									address={address}
									href={map.href}
									locale={location.addressLanguage}
								/>
							) : (
								address
							)}
						</p>
					)}
					{position === CONTACT_MAP_POSITION.address && preview}
					<ContactPeople people={location.people} />
				</address>
			</div>
			{position !== CONTACT_MAP_POSITION.address && preview}
		</section>
	);
}

export function Contacts({
	settings,
	locale,
}: {
	readonly settings: SiteSettingsView;
	readonly locale: Locale;
}) {
	return (
		<div className={styles.locations} lang={DEFAULT_LOCALE}>
			{settings.locations?.map((location) => (
				<OfficeCard key={location.id} location={location} locale={locale} />
			))}
		</div>
	);
}
