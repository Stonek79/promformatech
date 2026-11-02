import type { Field, TextField } from "payload";
import { getArrayLabels } from "@/i18n/messages";
import { linkField, mediaField, seoField } from "../fields/common";
import { omitPolicyLinks } from "../hooks/retired-content";

const text = (name: string, label: string): TextField => ({
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
		hooks: { afterRead: [omitPolicyLinks], beforeValidate: [omitPolicyLinks] },
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
		hooks: { afterRead: [omitPolicyLinks], beforeValidate: [omitPolicyLinks] },
		type: "array",
		label: "Ссылки в подвале",
		labels: getArrayLabels("footerLinks"),
		fields: [text("label", "Подпись"), linkField()],
	},
	text("copyright", "Подпись авторских прав"),
];

export const interfaceFields: Field[] = [
	{
		name: "labels",
		type: "group",
		label: "Подписи на сайте",
		fields: [
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
