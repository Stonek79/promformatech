import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import type { SiteSetting } from "@/payload-types";
import {
	type LocalizedText,
	localizedText,
	matchRows,
} from "./localized-fields";

type Location = NonNullable<SiteSetting["locations"]>[number];
type Person = NonNullable<Location["people"]>[number];
type LabeledLink = NonNullable<SiteSetting["footerLinks"]>[number];

type ContactPerson = Person & { readonly positionLanguage: Locale };
type LocalizedLink<T> = T & { readonly labelLanguage: Locale };

export type ContactLocation = Omit<Location, "people"> & {
	readonly addressLanguage: Locale;
	readonly titleLanguage: Locale;
	readonly people: ContactPerson[];
	readonly searchAddress?: string;
};

export type SiteSettingsView = Omit<
	SiteSetting,
	"locations" | "navigation" | "footerLinks"
> & {
	readonly locations: ContactLocation[];
	readonly navigation: LocalizedLink<
		NonNullable<SiteSetting["navigation"]>[number]
	>[];
	readonly footerLinks: LocalizedLink<LabeledLink>[];
	readonly footer: {
		readonly title: LocalizedText;
		readonly hours: LocalizedText;
		readonly copyright: LocalizedText;
	};
};

function localizeOffice(
	locale: Locale,
	location: Location,
	source?: Location,
): ContactLocation {
	const title = localizedText(locale, location.title, source?.title);
	const address = localizedText(locale, location.address, source?.address);
	const people = matchRows(
		location.people,
		source?.people,
		(person, original) => {
			const position = localizedText(
				locale,
				person.position,
				original?.position,
			);
			return {
				...person,
				position: position.value,
				positionLanguage: position.lang,
			};
		},
	);
	return {
		...location,
		title: title.value,
		titleLanguage: title.lang,
		address: address.value,
		addressLanguage: address.lang,
		searchAddress: source?.address?.trim() || address.value,
		people,
	};
}

function localizeLinks<T extends LabeledLink>(
	locale: Locale,
	rows?: T[] | null,
	sourceRows?: T[] | null,
): LocalizedLink<T>[] {
	return matchRows(rows, sourceRows, (row, source) => {
		const label = localizedText(locale, row.label, source?.label);
		return { ...row, label: label.value, labelLanguage: label.lang };
	});
}

export async function readLocalizedSettings(
	locale: Locale,
	load: (locale: Locale) => Promise<SiteSetting>,
): Promise<SiteSettingsView> {
	const [settings, source] = await Promise.all([
		load(locale),
		locale === DEFAULT_LOCALE ? undefined : load(DEFAULT_LOCALE),
	]);
	return {
		...settings,
		locations: matchRows(
			settings.locations,
			source?.locations,
			(row, original) => localizeOffice(locale, row, original),
		),
		navigation: localizeLinks(locale, settings.navigation, source?.navigation),
		footerLinks: localizeLinks(
			locale,
			settings.footerLinks,
			source?.footerLinks,
		),
		footer: {
			title: localizedText(locale, settings.footerTitle, source?.footerTitle),
			hours: localizedText(locale, settings.hours, source?.hours),
			copyright: localizedText(locale, settings.copyright, source?.copyright),
		},
	};
}
