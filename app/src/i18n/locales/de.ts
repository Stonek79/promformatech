import { TEXT_SIZES } from "@/config/appearance";
import type { Messages } from "../messages";
import { ru } from "./ru";

export const de = {
	common: {
		close: "Schließen",
		brand: "PromFormaTech",
		brandPrefix: "Prom",
		skipToContent: "Zum Inhalt",
		preparing: "Die Website befindet sich im Aufbau",
		loadingLabel: "Seite wird geladen",
		loading: "Seite wird geladen …",
		contacts: "Kontakt",
		footerNavigation: "Navigation im Seitenfuß",
	},
	footer: {
		hours: (open: string, close: string) =>
			`Öffnungszeiten: ${open}–${close} Uhr`,
		copyright: (year: string, brand: string) =>
			`© ${year} ${brand}. Alle Rechte vorbehalten.`,
	},
	map: {
		openAddress: (address: string) => `Auf der Karte öffnen: ${address}`,
	},
	appearance: {
		darkTheme: "Dunkelmodus",
		useLightTheme: "Zum Hellmodus wechseln",
		useDarkTheme: "Zum Dunkelmodus wechseln",
		sizeAction: (current: string) => `Schriftgröße: ${current}`,
		sizeHint: (current: string, next: string) =>
			`Schriftgröße: ${current}. Zum Wechsel auf „${next}“ auswählen.`,
		sizes: {
			[TEXT_SIZES.standard]: "Standard",
			[TEXT_SIZES.large]: "Groß",
			[TEXT_SIZES.larger]: "Sehr groß",
		},
	},
	navigation: {
		back: "Zurück",
		toTop: "Nach oben",
		openSearch: "Suche öffnen",
		searchTitle: "Website durchsuchen",
		search: "Suche",
		searchPlaceholder: "Bezeichnung eingeben",
		searchButton: "Suchen",
		menu: "Menü",
		openMenu: "Menü öffnen",
		mobileMenu: "Mobiles Menü",
		mainMenu: "Hauptnavigation",
		homeLabel: (company: string) => `${company} – Startseite`,
		changeLanguage: (current: string) => `Sprache der Website: ${current}`,
		languages: "Sprache der Website",
		items: {
			home: "Startseite",
			about: "Über uns",
			products: "Produkte",
			services: "Leistungen",
			projects: "Referenzen",
			contact: "Kontakt",
		},
	},
	labels: {
		searchTitle: "Website durchsuchen",
		searchPlaceholder: "Bezeichnung eingeben",
		searchButton: "Suchen",
		emptySearch: "Keine Treffer. Versuchen Sie einen anderen Suchbegriff.",
		emptyList:
			"Hier gibt es noch keine Inhalte. Kontaktieren Sie uns zu Ihrem Projekt.",
		readMore: "Mehr erfahren",
		task: "Kundenanforderungen",
		solution: "Unsere Lösung",
		result: "Ergebnis",
		gallery: "Fotos und Videos",
		specifications: "Technische Daten",
	},
	search: {
		loading: "Suche läuft …",
		failed: "Die Suchergebnisse konnten nicht geladen werden.",
		all: "Alle Ergebnisse anzeigen",
		resultsShown: (count: number) => `Angezeigte Treffer: ${count}`,
		types: {
			pages: "Seite",
			products: "Produkt",
			services: "Leistung",
			projects: "Projekt",
		},
		resultsTitle: (title: string, query: string) =>
			query ? `${title}: ${query}` : title,
	},
	favorites: {
		description: "Beschreibung",
		title: "Merkliste",
		toggle: (title: string) => `Merkliste — ${title}`,
		add: "Auf die Merkliste",
		saved: "Auf der Merkliste",
		empty: "Speichern Sie Produkte mit dem Herzsymbol in Ihrer Merkliste.",
		catalog: "Zum Produktkatalog",
		select: "Zum Vergleich auswählen",
		compare: "Vergleichen",
		comparison: "Produktvergleich",
		hint: (min: number, max: number) =>
			`Wählen Sie ${min} bis ${max} Produkte aus.`,
		loading: "Produkte werden geladen …",
		error: "Die Merkliste konnte nicht geladen werden.",
		unavailable: "Dieses Produkt ist nicht mehr verfügbar",
		remove: "Aus der Merkliste entfernen",
		spec: "Merkmal",
		scrollHint: "Die Tabelle lässt sich seitlich scrollen.",
	},
	error: {
		title: "Die Seite konnte nicht geladen werden",
		description: "Bitte versuchen Sie es in Kürze erneut.",
		retry: "Erneut versuchen",
	},
	media: {
		zoomIn: "Foto vergrößern",
		zoomOut: "Verkleinern",
		zoomReset: "Zoom zurücksetzen",
		open: (title: string) => `Öffnen: ${title}`,
		captions: "Russische Untertitel",
		unsupportedVideo: "Ihr Browser unterstützt keine Videowiedergabe.",
	},
	preview: {
		label: "Vorschaumodus",
		status: "Vorschau – die Änderungen sind noch unveröffentlicht",
		back: "Zurück zum Editor",
		exit: "Vorschau beenden",
	},
	notFound: {
		title: "Seite nicht gefunden",
		description:
			"Die Seite wurde möglicherweise entfernt oder hat eine neue Adresse.",
		home: "Zurück zur Startseite",
	},
	cms: ru.cms,
} satisfies Messages;
