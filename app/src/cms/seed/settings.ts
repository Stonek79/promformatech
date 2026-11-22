import type { Payload } from "payload";
import { GLOBALS, PUBLICATION, ROUTES } from "@/config/content";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import type { AssetLookup } from "./assets";

const officeAddresses = {
	[LOCALES.ru]: "г. Москва, ул. Маршала Соколовского, д. 3, этаж 4",
	[LOCALES.en]: "3 Marshala Sokolovskogo Street, 4th floor, Moscow",
	[LOCALES.de]: "Marschala-Sokolowskogo-Straße 3, 4. Stock, Moskau",
} as const;

const navigationItems = [
	{ url: ROUTES.home, key: "home" },
	{ url: ROUTES.about, key: "about" },
	{ url: ROUTES.products, key: "products" },
	{ url: ROUTES.projects, key: "projects" },
	{ url: ROUTES.contact, key: "contact" },
] as const;

function settingsCopy(locale: Locale) {
	const messages = getMessages(locale);
	return {
		footerTitle: messages.common.contacts,
		hours: messages.footer.hours("9:00", "18:00"),
		copyright: messages.footer.copyright("2026", messages.common.brand),
	};
}

export async function seedInitialSettings(cms: Payload, asset: AssetLookup) {
	const data = initialSettings(asset);
	const { locations, navigation } = await cms.updateGlobal({
		slug: GLOBALS.site,
		locale: DEFAULT_LOCALE,
		data: { ...data, _status: PUBLICATION.published },
		overrideAccess: true,
	});
	for (const locale of [LOCALES.en, LOCALES.de]) {
		const labels = getMessages(locale).navigation.items;
		const labelsByURL = new Map<string, string>(
			navigationItems.map(({ url, key }) => [url, labels[key]]),
		);
		await cms.updateGlobal({
			slug: GLOBALS.site,
			locale,
			data: {
				...settingsCopy(locale),
				_status: PUBLICATION.published,
				navigation: navigation?.map((item) => ({
					...item,
					label: labelsByURL.get(item.url ?? ""),
				})),
				locations: locations?.map((office) => ({
					...office,
					title: undefined,
					address: office.showInFooter ? officeAddresses[locale] : undefined,
					people: office.people?.map((person) => ({
						...person,
						position: undefined,
					})),
				})),
			},
			overrideAccess: true,
		});
	}
}

function initialSettings(asset: AssetLookup) {
	return {
		companyName: "ПромФормаТех",
		tagline:
			"Пресс-формы, оборудование и автоматизация производств. Прямые поставки из Китая.",
		logo: asset("logo"),
		footerLogo: asset("footerLogo"),
		phone: "+7 985 306-98-66",
		email: "jack@bgmold.com",
		...settingsCopy(DEFAULT_LOCALE),
		navigation: navigationItems.map(({ key, url }) => ({
			label: getMessages().navigation.items[key],
			url,
			visible: true,
		})),
		footerLinks: [],
		locations: [
			{
				title: "Офис в Москве",
				address: officeAddresses[LOCALES.ru],
				showInFooter: true,
				map: {
					url: "https://www.openstreetmap.org/?mlat=55.79323&mlon=37.48931#map=17/55.79323/37.48931",
					existingPreview: "/maps/moscow-office.webp",
				},
				people: [
					{
						name: "Jack",
						position: "Учредитель",
						phone: "+7 985 306-98-66",
						email: "jack@bgmold.com",
						messengerURL: "https://wa.me/8613757670503",
					},
					{
						name: "Alice",
						position: "Руководитель проектов",
						phone: "+7 968 971-30-47",
						email: "alice@bgmold.com",
						messengerURL: "https://wa.me/79689713047",
					},
				],
			},
			{
				title: "Коммерческий отдел Ningbo Linyue — Китай",
				address:
					"Китай, г. Нинбо, район Хайшу, посёлок Цзишигaн, научно-технологический парк Hengyu 1228",
				people: [
					{
						name: "Gils",
						email: "gils@bgmold.com",
						phone: "+86 187 9263 7023",
					},
				],
			},
			{
				title: "Производственная площадка Ningbo Linyue — Китай",
				address:
					"Китай, г. Нинбо, район Фэнхуа, экономическая зона Фэнхуа, новый прибрежный район, ул. Биньша, 397",
				people: [
					{
						name: "Gils",
						email: "gils@bgmold.com",
						phone: "+86 187 9263 7023",
					},
				],
			},
			{
				title: "Производственная площадка в Тайчжоу — Китай",
				address:
					"Китай, провинция Чжэцзян, г. Тайчжоу, район Хуанъянь, улица Синьцянь, ул. Хоуши, 28, корпус 1",
				people: [
					{ name: "Jack", phone: "+7 985 306-98-66", email: "jack@bgmold.com" },
				],
			},
		],
		labels: {
			searchTitle: "Поиск по сайту",
			searchPlaceholder: "Что найти?",
			searchButton: "Найти",
			emptySearch:
				"По вашему запросу ничего не найдено. Попробуйте другое название.",
			emptyList:
				"Материалы этого раздела скоро появятся. Свяжитесь с нами, чтобы обсудить вашу задачу.",
			readMore: "Подробнее",
			task: "Задача клиента",
			solution: "Наше решение",
			result: "Результат",
			gallery: "Фото и видео",
			specifications: "Характеристики",
		},
		seo: {
			title: "ПромФормаТех",
			description:
				"Пресс-формы, промышленное оборудование, автоматизация и комплектующие. Поставка из Китая и сопровождение проектов в России.",
			image: asset("hero"),
		},
	};
}
