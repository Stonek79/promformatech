import type { Field } from "payload";
import { getArrayLabels } from "@/i18n/messages";
import { linkField, mediaField, seoField } from "../fields/common";

const text = (name: string, label: string): Field => ({
	name,
	type: "text",
	label,
});

export const brandFields: Field[] = [
	{
		name: "companyName",
		type: "text",
		label: "Название компании",
		required: true,
	},
	text("tagline", "Краткое описание компании"),
	mediaField("logo", "Логотип в шапке"),
	mediaField("footerLogo", "Логотип в подвале"),
];

export const contactFields: Field[] = [
	text("phone", "Основной телефон"),
	{ name: "email", type: "email", label: "Публичный email" },
	text("address", "Основной адрес"),
	text("hours", "Время работы"),
	{
		name: "locations",
		type: "array",
		label: "Офисы и производства",
		labels: getArrayLabels("locations"),
		fields: [
			text("title", "Название"),
			{ name: "address", type: "textarea", label: "Адрес" },
			{
				name: "people",
				type: "array",
				label: "Контактные лица",
				labels: getArrayLabels("people"),
				fields: [
					text("name", "Имя"),
					text("position", "Должность"),
					text("phone", "Телефон"),
					{ name: "email", type: "email", label: "Email" },
					linkField("messengerURL", "Ссылка на мессенджер"),
				],
			},
		],
	},
];

export const navigationFields: Field[] = [
	{
		name: "navigation",
		type: "array",
		label: "Главное меню",
		labels: getArrayLabels("navigation"),
		fields: [
			{ name: "label", type: "text", label: "Подпись", required: true },
			linkField(),
			{
				name: "visible",
				type: "checkbox",
				label: "Показывать",
				defaultValue: true,
			},
		],
	},
	{
		name: "footerLinks",
		type: "array",
		label: "Ссылки в подвале",
		labels: getArrayLabels("footerLinks"),
		fields: [text("label", "Подпись"), linkField()],
	},
	text("copyright", "Подпись авторских прав"),
];

export const formFields: Field[] = [
	{
		name: "form",
		type: "group",
		label: "Форма связи",
		fields: [
			text("title", "Заголовок"),
			text("description", "Пояснение"),
			text("nameLabel", "Подпись поля имени"),
			text("namePlaceholder", "Пример имени"),
			text("contactLabel", "Подпись поля контакта"),
			text("contactPlaceholder", "Пример контакта"),
			text("messageLabel", "Подпись сообщения"),
			text("messagePlaceholder", "Пример сообщения"),
			text("consentLabel", "Текст согласия"),
			text("consentLinkLabel", "Подпись ссылки на политику"),
			linkField("privacyURL", "Ссылка на политику"),
			text("submitLabel", "Текст кнопки"),
			text("pendingLabel", "Текст во время отправки"),
			text("successMessage", "Сообщение после сохранения заявки"),
			text("errorMessage", "Сообщение при ошибке"),
		],
	},
];

export const interfaceFields: Field[] = [
	{
		name: "labels",
		type: "group",
		label: "Подписи на сайте",
		fields: [
			text("request", "Кнопка заявки"),
			text("searchTitle", "Заголовок поиска"),
			text("searchPlaceholder", "Подсказка поиска"),
			text("searchButton", "Кнопка поиска"),
			text("emptySearch", "Пустой результат поиска"),
			text("emptyList", "Пустой список материалов"),
			text("readMore", "Ссылка на материал"),
			text("contactTitle", "Заголовок контактов"),
			text("task", "Заголовок задачи проекта"),
			text("solution", "Заголовок решения проекта"),
			text("result", "Заголовок результата проекта"),
			text("gallery", "Заголовок галереи"),
			text("specifications", "Заголовок характеристик"),
		],
	},
	seoField(),
];
