import type { Field, TextField } from "payload";
import { text as validateText } from "payload/shared";
import { COLLECTIONS, CONTENT_LIMITS } from "@/config/content";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { isSafeHref, isValidSlug } from "@/lib/urls";

export function requiredSourceText(
	value: string | null | undefined,
	options: Parameters<typeof validateText>[1],
) {
	return validateText(value?.trim(), {
		...options,
		required: options.req.locale === DEFAULT_LOCALE,
	});
}

export const titleField = (
	localized = false,
): Extract<TextField, { hasMany?: false }> => ({
	name: "title",
	type: "text",
	label: "Название",
	required: !localized,
	localized,
	...(localized ? { validate: requiredSourceText } : {}),
	maxLength: CONTENT_LIMITS.title,
});

export const headingField = (localized = false): Field => ({
	name: "heading",
	type: "text",
	label: "Заголовок",
	localized,
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

export const seoField = (localized = false): Field => ({
	name: "seo",
	type: "group",
	label: "Для поисковиков и ссылок",
	fields: [
		{ name: "title", type: "text", label: "Заголовок в поиске", localized },
		{
			name: "description",
			type: "textarea",
			label: "Описание в поиске",
			localized,
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

export const galleryField = (localized = false): Field => ({
	name: "gallery",
	type: "array",
	labels: { singular: "файл", plural: "файлы" },
	label: "Фотографии и видео",
	admin: { description: "Перетаскивайте строки, чтобы изменить порядок." },
	fields: [
		mediaField("asset", "Файл"),
		{ name: "caption", type: "text", label: "Подпись", localized },
	],
});
