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
	footer: {
		hours: (open: string, close: string) => `с ${open} до ${close}`,
		copyright: (year: string, brand: string) =>
			`© ${year}. ${brand}. Все права защищены.`,
	},
	map: {
		openAddress: (address: string) => `Открыть карту: ${address}`,
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
		changeLanguage: (current: string) => `Язык сайта: ${current}`,
		languages: "Язык сайта",
		items: {
			home: "Главная",
			about: "О компании",
			products: "Наша продукция",
			services: "Услуги",
			projects: "Реализованные проекты",
			contact: "Контакты",
		},
	},
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
	search: {
		resultsTitle: (title: string, query: string) =>
			query ? `${title}: ${query}` : title,
	},
	error: {
		title: "Не удалось загрузить страницу",
		description: "Попробуйте ещё раз немного позже.",
		retry: "Повторить",
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
		mediaNaming: {
			fallback: (timestamp: string) => `Файл от ${timestamp}`,
			fileNumber: (id: number) => `Файл №${id}`,
			helpSummary:
				"Загрузите исходник и дождитесь статуса «Готово». Название создаётся по имени файла, его можно изменить. Оптимизированные копии создаются автоматически, оригинал сохраняется отдельно.",
			helpStep:
				"Проверьте автоматически заполненное «Название» и при необходимости измените его. В «Что изображено» коротко опишите фотографию для людей, которые её не видят; в «Подпись» добавьте пояснение при необходимости. Нажмите «Сохранить черновик», чтобы загрузить файл и запустить обработку.",
			helpReady:
				"Дождитесь сообщения «Готово к публикации» в поле готовности. Фоновая обработка продолжается, даже если вы закроете страницу. Готовый файл будет опубликован вместе с материалом, в котором он выбран.",
		},
		mediaPublication: {
			missing: (file: string) =>
				`Файл «${file}» не найден. Выберите другой файл в материале.`,
			archived: (file: string) =>
				`Файл «${file}» находится в архиве. Верните его из архива или выберите другой файл.`,
			notReady: (file: string) =>
				`Файл «${file}» ещё не готов. Проверьте обработку в разделе «Фото и видео».`,
			processingFailed: (file: string) =>
				`Не удалось обработать файл «${file}». Откройте его в разделе «Фото и видео» и повторите обработку или загрузите другой файл.`,
			wrongKind: (file: string) =>
				`Файл «${file}» выбран не в том поле. Используйте фотографию для изображения и видеозапись для видео.`,
			invalid: (file: string, reason: string) =>
				`Не удалось опубликовать файл «${file}»: ${reason} Откройте его в разделе «Фото и видео» и исправьте ошибку.`,
		},
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
