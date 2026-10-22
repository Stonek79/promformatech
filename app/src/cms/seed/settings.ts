import { ROUTES } from "@/config/content";
import type { AssetLookup } from "./assets";

export function initialSettings(asset: AssetLookup) {
	return {
		companyName: "ПромФормаТех",
		tagline:
			"Пресс-формы, оборудование и автоматизация производств. Прямые поставки из Китая.",
		logo: asset("logo"),
		footerLogo: asset("footerLogo"),
		phone: "+7 985 306-98-66",
		email: "jack@bgmold.com",
		address: "г. Москва, ул. Маршала Соколовского, д. 3, этаж 4",
		hours: "с 9:00 до 18:00",
		navigation: [
			{ label: "Главная", url: ROUTES.home, visible: true },
			{ label: "О компании", url: ROUTES.about, visible: true },
			{
				label: "Наша продукция",
				url: ROUTES.products,
				visible: true,
			},
			{
				label: "Реализованные проекты",
				url: ROUTES.projects,
				visible: true,
			},
			{ label: "Контакты", url: ROUTES.contact, visible: true },
		],
		footerLinks: [{ label: "Политика обработки данных", url: "/privacy" }],
		copyright: "© 2026. ПромФормаТех. Все права защищены.",
		locations: [
			{
				title: "Офис в Москве",
				address: "г. Москва, ул. Маршала Соколовского, д. 3, этаж 4",
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
		form: {
			title: "Связаться с нами",
			description: "Оставьте свои контакты, и мы с вами свяжемся",
			nameLabel: "Ваше имя",
			namePlaceholder: "Как к вам обращаться",
			contactLabel: "Телефон или email",
			contactPlaceholder: "+7 … или name@company.ru",
			messageLabel: "Расскажите о задаче",
			messagePlaceholder:
				"Что нужно изготовить, поставить или автоматизировать?",
			consentLabel: "Согласен с условиями",
			consentLinkLabel: "обработки персональных данных",
			privacyURL: "/privacy",
			submitLabel: "Отправить заявку",
			pendingLabel: "Сохраняем заявку…",
			successMessage: "Спасибо! Заявка сохранена. Мы свяжемся с вами.",
			errorMessage:
				"Не удалось сохранить заявку. Повторите отправку или свяжитесь с нами по телефону.",
		},
		labels: {
			request: "Оставить заявку",
			searchTitle: "Поиск по сайту",
			searchPlaceholder: "Что найти?",
			searchButton: "Найти",
			emptySearch:
				"По вашему запросу ничего не найдено. Попробуйте другое название.",
			emptyList:
				"Материалы этого раздела скоро появятся. Свяжитесь с нами, чтобы обсудить вашу задачу.",
			readMore: "Подробнее",
			contactTitle: "Контакты",
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
