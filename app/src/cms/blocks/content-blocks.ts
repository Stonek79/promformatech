import type { Block, Field } from "payload";
import { BLOCK_TYPES } from "@/config/blocks";
import { SHOWCASE_COLLECTIONS } from "@/config/content";
import { getArrayLabels } from "@/i18n/messages";
import {
	galleryField,
	headingField,
	linkField,
	mediaField,
	requiredSourceText,
	visibilityField,
} from "../fields/common";

const fields = (...items: Field[]): Field[] => [visibilityField(), ...items];
const body = (localized: boolean): Field => ({
	name: "body",
	type: "richText",
	label: "Текст",
	localized,
});

function contentBlocks(localized: boolean): Block[] {
	const Hero: Block = {
		slug: BLOCK_TYPES.hero,
		labels: { singular: "Первый экран", plural: "Первые экраны" },
		fields: fields(
			headingField(localized),
			{ name: "text", type: "textarea", label: "Описание", localized },
			mediaField(),
			{ name: "buttonLabel", type: "text", label: "Текст кнопки", localized },
			linkField("buttonURL", "Ссылка кнопки"),
		),
	};

	const Text: Block = {
		slug: BLOCK_TYPES.text,
		labels: { singular: "Текст", plural: "Текстовые блоки" },
		fields: fields(headingField(localized), body(localized)),
	};

	const TextImage: Block = {
		slug: BLOCK_TYPES.textImage,
		labels: { singular: "Текст с фотографией", plural: "Текст с фотографией" },
		fields: fields(headingField(localized), body(localized), mediaField(), {
			name: "imagePosition",
			type: "select",
			label: "Расположение фотографии",
			defaultValue: "right",
			options: [
				{ label: "Справа", value: "right" },
				{ label: "Слева", value: "left" },
			],
		}),
	};

	const Gallery: Block = {
		slug: BLOCK_TYPES.gallery,
		labels: { singular: "Галерея фото и видео", plural: "Галереи" },
		fields: fields(headingField(localized), galleryField(localized)),
	};

	const Video: Block = {
		slug: BLOCK_TYPES.video,
		labels: { singular: "Видео", plural: "Видео" },
		fields: fields(
			headingField(localized),
			mediaField("video", "Видеозапись"),
			{
				name: "caption",
				type: "text",
				label: "Подпись",
				localized,
			},
		),
	};

	const Steps: Block = {
		slug: BLOCK_TYPES.steps,
		labels: {
			singular: "Этапы сотрудничества",
			plural: "Этапы сотрудничества",
		},
		fields: fields(headingField(localized), {
			name: "items",
			type: "array",
			label: "Этапы",
			labels: getArrayLabels("steps"),
			fields: [
				{
					name: "title",
					type: "text",
					label: "Название",
					localized,
					required: !localized,
					...(localized ? { validate: requiredSourceText } : {}),
				},
				{ name: "text", type: "textarea", label: "Описание", localized },
				{
					name: "duration",
					type: "text",
					label: "Срок",
					localized,
					admin: { placeholder: "5–8 дней" },
				},
			],
		}),
	};

	const Specifications: Block = {
		slug: BLOCK_TYPES.specifications,
		labels: { singular: "Характеристики", plural: "Характеристики" },
		fields: fields(headingField(localized), {
			name: "items",
			type: "array",
			label: "Строки",
			labels: getArrayLabels("rows"),
			fields: [
				{
					name: "label",
					type: "text",
					label: "Название",
					localized,
					required: !localized,
					...(localized ? { validate: requiredSourceText } : {}),
				},
				{
					name: "value",
					type: "text",
					label: "Значение",
					localized,
					required: !localized,
					...(localized ? { validate: requiredSourceText } : {}),
				},
			],
		}),
	};

	const Cards: Block = {
		slug: BLOCK_TYPES.cards,
		labels: { singular: "Карточки материалов", plural: "Карточки материалов" },
		fields: fields(headingField(localized), {
			name: "items",
			type: "relationship",
			label: "Материалы и их порядок",
			relationTo: [...SHOWCASE_COLLECTIONS],
			hasMany: true,
			admin: {
				description:
					"Выберите продукцию, услуги или проекты. На сайте показываются только опубликованные материалы.",
			},
		}),
	};

	const CallToAction: Block = {
		slug: BLOCK_TYPES.callToAction,
		labels: { singular: "Призыв связаться", plural: "Призывы связаться" },
		fields: fields(
			headingField(localized),
			{ name: "text", type: "textarea", label: "Описание", localized },
			{
				name: "buttonLabel",
				type: "text",
				label: "Текст кнопки",
				localized,
			},
			linkField("buttonURL", "Ссылка кнопки"),
		),
	};

	return [
		Hero,
		Text,
		TextImage,
		Cards,
		Steps,
		Gallery,
		Video,
		Specifications,
		CallToAction,
	];
}

export const blocksField = (localized = false): Field => ({
	name: "blocks",
	type: "blocks",
	labels: { singular: "блок", plural: "блоки" },
	label: "Содержимое страницы",
	blocks: contentBlocks(localized),
	defaultValue: [],
	admin: {
		description:
			"Добавляйте готовые блоки, меняйте их порядок и отключайте ненужные. Сохраните черновик перед предпросмотром.",
	},
});
