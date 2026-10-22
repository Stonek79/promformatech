import type { Field } from "payload";
import { COLLECTIONS, CONTENT_LIMITS } from "@/config/content";
import { isSafeHref, isValidSlug } from "@/lib/urls";

export const titleField = (): Field => ({
	name: "title",
	type: "text",
	label: "Название",
	required: true,
	maxLength: CONTENT_LIMITS.title,
});

export const headingField = (): Field => ({
	name: "heading",
	type: "text",
	label: "Заголовок",
});
export const visibilityField = (): Field => ({
	name: "visible",
	type: "checkbox",
	label: "Показывать блок",
	defaultValue: true,
});

export const mediaField = (name = "image", label = "Фотография"): Field => ({
	name,
	type: "upload",
	relationTo: COLLECTIONS.media,
	label,
	admin: {
		description:
			"Загрузите новый файл или выберите из медиатеки. Для публикации файл должен быть готов.",
	},
});

export const linkField = (
	name = "url",
	label = "Куда ведёт ссылка",
): Field => ({
	name,
	type: "text",
	label,
	validate: (value: unknown) =>
		!value ||
		isSafeHref(value) ||
		"Укажите адрес /страницы, https://…, mailto:… или tel:…",
});

export const slugField = (): Field => ({
	name: "slug",
	type: "text",
	label: "Адрес страницы",
	required: true,
	unique: true,
	admin: {
		description:
			"Короткое английское название через дефис, например injection-mold. Для русского названия автоматически создаётся постоянный технический адрес. Суффикс .html не нужен.",
	},
	validate: (value: unknown) =>
		(typeof value === "string" && isValidSlug(value)) ||
		"Используйте латинские буквы, цифры и дефисы; служебные адреса заняты.",
});

export const seoField = (): Field => ({
	name: "seo",
	type: "group",
	label: "Для поисковиков и ссылок",
	fields: [
		{ name: "title", type: "text", label: "Заголовок в поиске" },
		{
			name: "description",
			type: "textarea",
			label: "Описание в поиске",
			maxLength: CONTENT_LIMITS.summary,
		},
		mediaField("image", "Изображение для ссылки"),
		{
			name: "noIndex",
			type: "checkbox",
			label: "Не показывать в поисковиках",
			defaultValue: false,
		},
	],
});

export const mediaReferencesField = (): Field => ({
	name: "referencedMedia",
	type: "relationship",
	relationTo: COLLECTIONS.media,
	hasMany: true,
	admin: { hidden: true },
	access: { create: () => false, update: () => false },
});

export const galleryField = (): Field => ({
	name: "gallery",
	type: "array",
	labels: { singular: "файл", plural: "файлы" },
	label: "Фотографии и видео",
	admin: { description: "Перетаскивайте строки, чтобы изменить порядок." },
	fields: [
		mediaField("asset", "Файл"),
		{ name: "caption", type: "text", label: "Подпись" },
	],
});
