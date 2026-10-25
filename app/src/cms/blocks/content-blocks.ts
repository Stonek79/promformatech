import type { Block, Field } from "payload";
import { BLOCK_TYPES } from "@/config/blocks";
import { SHOWCASE_COLLECTIONS } from "@/config/content";
import { getArrayLabels } from "@/i18n/messages";
import {
	galleryField,
	headingField,
	linkField,
	mediaField,
	visibilityField,
} from "../fields/common";

const fields = (...items: Field[]): Field[] => [visibilityField(), ...items];
const body = (): Field => ({ name: "body", type: "richText", label: "Текст" });

const Hero: Block = {
	slug: BLOCK_TYPES.hero,
	labels: { singular: "Первый экран", plural: "Первые экраны" },
	fields: fields(
		headingField(),
		{ name: "text", type: "textarea", label: "Описание" },
		mediaField(),
		{ name: "buttonLabel", type: "text", label: "Текст кнопки" },
		linkField("buttonURL", "Ссылка кнопки"),
	),
};

const Text: Block = {
	slug: BLOCK_TYPES.text,
	labels: { singular: "Текст", plural: "Текстовые блоки" },
	fields: fields(headingField(), body()),
};

const TextImage: Block = {
	slug: BLOCK_TYPES.textImage,
	labels: { singular: "Текст с фотографией", plural: "Текст с фотографией" },
	fields: fields(headingField(), body(), mediaField(), {
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
	fields: fields(headingField(), galleryField()),
};

const Video: Block = {
	slug: BLOCK_TYPES.video,
	labels: { singular: "Видео", plural: "Видео" },
	fields: fields(headingField(), mediaField("video", "Видеозапись"), {
		name: "caption",
		type: "text",
		label: "Подпись",
	}),
};

const Steps: Block = {
	slug: BLOCK_TYPES.steps,
	labels: { singular: "Этапы сотрудничества", plural: "Этапы сотрудничества" },
	fields: fields(headingField(), {
		name: "items",
		type: "array",
		label: "Этапы",
		labels: getArrayLabels("steps"),
		fields: [
			{ name: "title", type: "text", label: "Название", required: true },
			{ name: "text", type: "textarea", label: "Описание" },
			{
				name: "duration",
				type: "text",
				label: "Срок",
				admin: { placeholder: "5–8 дней" },
			},
		],
	}),
};

const Specifications: Block = {
	slug: BLOCK_TYPES.specifications,
	labels: { singular: "Характеристики", plural: "Характеристики" },
	fields: fields(headingField(), {
		name: "items",
		type: "array",
		label: "Строки",
		labels: getArrayLabels("rows"),
		fields: [
			{ name: "label", type: "text", label: "Название", required: true },
			{ name: "value", type: "text", label: "Значение", required: true },
		],
	}),
};

const Cards: Block = {
	slug: BLOCK_TYPES.cards,
	labels: { singular: "Карточки материалов", plural: "Карточки материалов" },
	fields: fields(headingField(), {
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
		headingField(),
		{ name: "text", type: "textarea", label: "Описание" },
		{
			name: "buttonLabel",
			type: "text",
			label: "Текст кнопки",
		},
		linkField("buttonURL", "Ссылка кнопки"),
	),
};

const ContactForm: Block = {
	slug: BLOCK_TYPES.contactForm,
	labels: { singular: "Форма связи", plural: "Формы связи" },
	fields: fields(),
};

const contentBlocks: Block[] = [
	ContactForm,
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
export const blocksField = (): Field => ({
	name: "blocks",
	type: "blocks",
	labels: { singular: "блок", plural: "блоки" },
	label: "Содержимое страницы",
	blocks: contentBlocks,
	defaultValue: [{ blockType: BLOCK_TYPES.contactForm, visible: true }],
	admin: {
		description:
			"Добавляйте готовые блоки, меняйте их порядок и отключайте ненужные. Сохраните черновик перед предпросмотром.",
	},
});
