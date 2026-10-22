import type { CollectionConfig, Field } from "payload";
import {
	ADMIN_BREAKPOINTS,
	CONTENT_LIMITS,
	type ShowcaseCollection,
} from "@/config/content";
import { ownerOnly, publishedOrStaff, staffOnly } from "../access";
import { blocksField } from "../blocks/content-blocks";
import {
	galleryField,
	mediaField,
	mediaReferencesField,
	seoField,
	slugField,
	titleField,
} from "../fields/common";
import { helpDescription } from "../help/config";
import {
	assignSlug,
	invalidatePublishedContent,
	protectCollectionDrafts,
	validateCollectionPublication,
} from "../hooks/content";
import { previewURL } from "../preview";

type ShowcaseOptions = {
	readonly slug: ShowcaseCollection;
	readonly singular: string;
	readonly plural: string;
	readonly extraFields?: Field[];
};

export function showcaseCollection({
	slug,
	singular,
	plural,
	extraFields = [],
}: ShowcaseOptions): CollectionConfig {
	return {
		slug,
		labels: { singular, plural },
		defaultSort: "order",
		admin: {
			hideAPIURL: true,
			components: { Description: helpDescription(slug) },
			group: "Содержание сайта",
			useAsTitle: "title",
			defaultColumns: ["title", "_status", "order", "updatedAt"],
			preview: (doc) => previewURL({ collection: slug, id: doc.id }),
			livePreview: {
				url: ({ data }) => previewURL({ collection: slug, id: data.id }),
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
		hooks: {
			beforeOperation: [protectCollectionDrafts],
			beforeValidate: [assignSlug],
			beforeChange: [validateCollectionPublication],
			afterChange: [
				({ doc }) => {
					invalidatePublishedContent();
					return doc;
				},
			],
			afterDelete: [
				() => {
					invalidatePublishedContent();
				},
			],
		},
		fields: [
			titleField(),
			{
				type: "tabs",
				tabs: [
					{
						label: "Содержание",
						fields: [
							{
								name: "summary",
								type: "textarea",
								label: "Краткое описание",
								maxLength: CONTENT_LIMITS.summary,
							},
							...extraFields,
							blocksField(),
						],
					},
					{
						label: "Фото и видео",
						fields: [
							mediaField("featuredImage", "Главное изображение"),
							galleryField(),
						],
					},
					{
						label: "Дополнительно",
						fields: [
							slugField(),
							{
								name: "order",
								type: "number",
								label: "Порядок",
								defaultValue: 0,
							},
							seoField(),
						],
					},
				],
			},
			mediaReferencesField(),
		],
	};
}
