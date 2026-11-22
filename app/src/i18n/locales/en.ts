import { TEXT_SIZES } from "@/config/appearance";
import type { Messages } from "../messages";
import { ru } from "./ru";

export const en = {
	common: {
		close: "Close",
		brand: "PromFormaTech",
		skipToContent: "Skip to content",
		preparing: "The site is getting ready to launch",
		loadingLabel: "Loading page",
		loading: "Loading page…",
		contacts: "Contact",
		footerNavigation: "Footer navigation",
	},
	footer: {
		hours: (open: string, close: string) => `Hours: ${open}–${close}`,
		copyright: (year: string, brand: string) =>
			`© ${year} ${brand}. All rights reserved.`,
	},
	map: {
		openAddress: (address: string) => `Open map: ${address}`,
	},
	appearance: {
		darkTheme: "Dark mode",
		useLightTheme: "Switch to light mode",
		useDarkTheme: "Switch to dark mode",
		sizeAction: (current: string) => `Text size: ${current}`,
		sizeHint: (current: string, next: string) =>
			`Text size: ${current}. Select to switch to ${next}.`,
		sizes: {
			[TEXT_SIZES.standard]: "Standard",
			[TEXT_SIZES.large]: "Large",
			[TEXT_SIZES.larger]: "Extra large",
		},
	},
	navigation: {
		openSearch: "Open search",
		searchTitle: "Site search",
		search: "Search",
		searchPlaceholder: "Enter a name",
		searchButton: "Search",
		menu: "Menu",
		openMenu: "Open menu",
		mobileMenu: "Mobile navigation",
		mainMenu: "Main navigation",
		homeLabel: (company: string) => `${company} home`,
		changeLanguage: (current: string) => `Site language: ${current}`,
		languages: "Site language",
		items: {
			home: "Home",
			about: "About us",
			products: "Products",
			services: "Services",
			projects: "Completed projects",
			contact: "Contact",
		},
	},
	labels: {
		searchTitle: "Site search",
		searchPlaceholder: "Enter a name",
		searchButton: "Search",
		emptySearch: "No results. Try a different name.",
		emptyList: "No materials yet. Contact us to discuss your project.",
		readMore: "Read more",
		task: "Customer requirements",
		solution: "Our solution",
		result: "Outcome",
		gallery: "Photos and videos",
		specifications: "Specifications",
	},
	search: {
		resultsTitle: (title: string, query: string) =>
			query ? `${title}: ${query}` : title,
	},
	error: {
		title: "We couldn’t load the page",
		description: "Please try again in a moment.",
		retry: "Try again",
	},
	media: {
		open: (title: string) => `Open: ${title}`,
		captions: "Russian captions",
		unsupportedVideo: "Your browser does not support video playback.",
	},
	preview: {
		label: "Preview mode",
		status: "Preview — changes are not published yet",
		back: "Return to editor",
		exit: "Exit preview",
	},
	notFound: {
		title: "Page not found",
		description: "The page may be unpublished or its address may have changed.",
		home: "Back to home",
	},
	cms: ru.cms,
} satisfies Messages;
