import { TEXT_SIZES } from "@/config/appearance";

export const ru = {
	common: {
		close: "Закрыть",
		brand: "ПромФормаТех",
		skipToContent: "Перейти к содержимому",
		preparing: "Сайт готовится к запуску",
		loadingLabel: "Загрузка страницы",
		loading: "Загружаем страницу…",
		contacts: "Контакты",
		footerNavigation: "Дополнительная навигация",
	},
	appearance: {
		darkTheme: "Тёмная тема",
		useLightTheme: "Включить светлую тему",
		useDarkTheme: "Включить тёмную тему",
		sizeAction: (current: string) => `Размер текста: ${current}`,
		sizeHint: (current: string, next: string) =>
			`Размер текста: ${current}. Нажмите для размера «${next}».`,
		sizes: {
			[TEXT_SIZES.standard]: "Обычный",
			[TEXT_SIZES.large]: "Увеличенный",
			[TEXT_SIZES.larger]: "Крупный",
		},
	},
	navigation: {
		openSearch: "Открыть поиск",
		searchTitle: "Поиск по сайту",
		search: "Поиск",
		searchPlaceholder: "Что найти?",
		searchButton: "Найти",
		menu: "Меню",
		openMenu: "Открыть меню",
		mobileMenu: "Мобильное меню",
		mainMenu: "Основное меню",
		homeLabel: (company: string) => `${company} — главная`,
	},
	media: {
		open: (title: string) => `Открыть: ${title}`,
		captions: "Русские субтитры",
		unsupportedVideo: "Ваш браузер не поддерживает просмотр видео.",
	},
	preview: {
		label: "Режим предпросмотра",
		status: "Предпросмотр — изменения ещё не опубликованы",
		back: "Вернуться к редактированию",
		exit: "Выйти из предпросмотра",
	},
	notFound: {
		title: "Страница не найдена",
		description: "Возможно, материал ещё не опубликован или адрес изменился.",
		home: "На главную",
	},
	cms: {
		mediaProcessing: {
			interrupted:
				"Обработка прервана остановкой сервера. Файл сохранён и ожидает повторной попытки.",
			failed:
				"Не удалось подготовить файл. Проверьте, что он открывается, видео короче 15 минут и имеет разрешение не выше 4K. Можно повторить обработку или загрузить другой файл.",
			exhausted:
				"Обработка не завершилась после нескольких попыток. Исходник сохранён. Проверьте сервер и повторите обработку.",
		},
		arrays: {
			locations: {
				singular: "офис или производство",
				plural: "офисы и производства",
			},
			people: { singular: "контактное лицо", plural: "контактные лица" },
			navigation: { singular: "пункт меню", plural: "пункты меню" },
			footerLinks: { singular: "ссылку", plural: "ссылки" },
			specifications: { singular: "характеристику", plural: "характеристики" },
			steps: { singular: "этап", plural: "этапы" },
			rows: { singular: "строку", plural: "строки" },
		},
	},
};
