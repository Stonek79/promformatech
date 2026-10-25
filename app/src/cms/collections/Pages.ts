import type { CollectionConfig } from "payload";
import {
	ADMIN_BREAKPOINTS,
	COLLECTIONS,
	CONTENT_LIMITS,
	PAGE_KINDS,
} from "@/config/content";
import { ownerOnly, publishedOrStaff, staffOnly } from "../access";
import { blocksField } from "../blocks/content-blocks";
import {
	mediaReferencesField,
	seoField,
	slugField,
	titleField,
} from "../fields/common";
import { helpDescription } from "../help/config";
import { contentCollectionHooks } from "../hooks/content";
import { previewURL } from "../preview";

export const Pages: CollectionConfig = {
	slug: COLLECTIONS.pages,
	labels: { singular: "Страница", plural: "Страницы" },
	admin: {
		hideAPIURL: true,
		components: { Description: helpDescription(COLLECTIONS.pages) },
		group: "Содержание сайта",
		useAsTitle: "title",
		defaultColumns: ["title", "_status", "updatedAt"],
		preview: (doc) => previewURL({ collection: COLLECTIONS.pages, id: doc.id }),
		livePreview: {
			url: ({ data }) =>
				previewURL({ collection: COLLECTIONS.pages, id: data.id }),
			breakpoints: [...ADMIN_BREAKPOINTS],
		},
	},
	access: {
		create: staffOnly,
		read: publishedOrStaff,
		update: staffOnly,
		delete: ownerOnly,
		readVersions: staffOnly,
	},
	versions: { drafts: true, maxPerDoc: CONTENT_LIMITS.versions },
	hooks: contentCollectionHooks(),
	fields: [
		titleField(),
		{
			type: "tabs",
			tabs: [
				{
					label: "Содержание",
					fields: [
						{ name: "heading", type: "text", label: "Заголовок на сайте" },
						{
							name: "kind",
							type: "select",
							label: "Вид страницы",
							defaultValue: PAGE_KINDS.content,
							required: true,
							options: [
								{ label: "Обычная страница", value: PAGE_KINDS.content },
								{ label: "Главная", value: PAGE_KINDS.home },
								{ label: "Список продукции", value: PAGE_KINDS.products },
								{ label: "Список проектов", value: PAGE_KINDS.projects },
								{ label: "Список услуг", value: PAGE_KINDS.services },
								{ label: "Контакты", value: PAGE_KINDS.contacts },
							],
						},
						blocksField(),
					],
				},
				{ label: "Дополнительно", fields: [slugField(), seoField()] },
			],
		},
		mediaReferencesField(),
	],
};
