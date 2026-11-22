import type { Field, TextField } from "payload";
import { getArrayLabels } from "@/i18n/messages";
import {
	linkField,
	mediaField,
	requiredSourceText,
	seoField,
} from "../fields/common";
import { omitPolicyLinks } from "../hooks/retired-content";
import { contactMapField } from "./contact-map-field";

type SingleTextField = Extract<TextField, { hasMany?: false }>;

const text = (name: string, label: string): SingleTextField => ({
	name,
	type: "text",
	label,
});

const translated = (name: string, label: string): SingleTextField => ({
	...text(name, label),
	localized: true,
});

function isFooterOffice(location: unknown) {
	return Boolean(
		location &&
			typeof location === "object" &&
			"showInFooter" in location &&
			location.showInFooter === true,
	);
}

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
	{
		name: "locations",
		type: "array",
		label: "Офисы и производства",
		labels: getArrayLabels("locations"),
		validate: (locations) =>
			!Array.isArray(locations) ||
			locations.filter(isFooterOffice).length <= 1 ||
			"Выберите только один офис для подвала сайта.",
		fields: [
			translated("title", "Название"),
			{
				name: "address",
				type: "textarea",
				label: "Адрес",
				localized: true,
				admin: {
					description:
						"Выберите язык контента в верхней панели и введите адрес на этом языке.",
				},
			},
			{
				name: "showInFooter",
				type: "checkbox",
				label: "Использовать адрес и карту в подвале",
				defaultValue: false,
			},
			contactMapField(),
			{
				name: "people",
				type: "array",
				label: "Контактные лица",
				labels: getArrayLabels("people"),
				fields: [
					text("name", "Имя"),
					translated("position", "Должность"),
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
			{
				...translated("label", "Подпись"),
				validate: requiredSourceText,
			},
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
		fields: [translated("label", "Подпись"), linkField()],
	},
	translated("footerTitle", "Заголовок подвала"),
	translated("hours", "Время работы"),
	translated("copyright", "Подпись авторских прав"),
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
			text("task", "Заголовок задачи проекта"),
			text("solution", "Заголовок решения проекта"),
			text("result", "Заголовок результата проекта"),
			text("gallery", "Заголовок галереи"),
			text("specifications", "Заголовок характеристик"),
		],
	},
	seoField(),
];
