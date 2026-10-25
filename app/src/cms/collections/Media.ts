import type { CollectionConfig, Field } from "payload";
import {
	COLLECTIONS,
	CONTENT_LIMITS,
	CONTEXT,
	PUBLICATION,
} from "@/config/content";
import { MEDIA_MIME_TYPES, MEDIA_STATUS, mediaURL } from "@/config/media";
import { MEDIA_DELIVERY, MEDIA_KIND } from "@/config/media-assets";
import { deny, isStaff, mediaReader, staffOnly } from "../access";
import { retryMedia } from "../endpoints/retry-media";
import { helpDescription } from "../help/config";
import { protectCollectionDrafts } from "../hooks/content";
import {
	mediaDocumentURL,
	preserveOriginal,
	protectUsedMedia,
	publishReadyMedia,
	queueMedia,
} from "../hooks/media";
import { cleanupFailedUpload } from "../hooks/media-upload";

const internal = (field: Field): Field =>
	({
		...field,
		access: { create: () => false, update: () => false },
		admin: { ...field.admin, readOnly: true },
	}) as Field;

export const Media: CollectionConfig = {
	slug: COLLECTIONS.media,
	labels: { singular: "Файл", plural: "Фото и видео" },
	admin: {
		hideAPIURL: true,
		components: { Description: helpDescription(COLLECTIONS.media) },
		group: "Содержание сайта",
		useAsTitle: "title",
		defaultColumns: ["title", "mimeType", "processingStatus", "updatedAt"],
	},
	access: {
		create: staffOnly,
		read: mediaReader,
		update: staffOnly,
		delete: deny,
	},
	versions: { drafts: true, maxPerDoc: CONTENT_LIMITS.versions },
	endpoints: [{ path: "/:id/retry", method: "post", handler: retryMedia }],
	upload: {
		disableLocalStorage: true,
		staticDir: "private/payload-unused",
		mimeTypes: [...MEDIA_MIME_TYPES],
		filesRequiredOnCreate: true,
		bulkUpload: true,
	},
	hooks: {
		beforeOperation: [protectCollectionDrafts, protectUsedMedia],
		beforeChange: [
			preserveOriginal,
			publishReadyMedia,
			({ data, originalDoc }) => ({
				...data,
				hasCaptions: Boolean(
					Object.hasOwn(data, "captionTrack")
						? data.captionTrack
						: originalDoc?.captionTrack,
				),
			}),
		],
		afterChange: [queueMedia],
		afterError: [cleanupFailedUpload],
		afterRead: [
			({ doc }) => ({
				...doc,
				url: mediaDocumentURL(doc),
				thumbnailURL:
					doc.processingStatus === MEDIA_STATUS.ready
						? mediaURL(
								doc.id,
								doc.kind === MEDIA_KIND.video
									? MEDIA_DELIVERY.poster
									: MEDIA_DELIVERY.small,
								{
									draft: doc._status === PUBLICATION.draft,
								},
							)
						: undefined,
			}),
		],
	},
	fields: [
		internal({
			name: "seedKey",
			type: "text",
			unique: true,
			index: true,
			admin: { hidden: true },
		}),
		{ name: "title", type: "text", label: "Название", required: true },
		{
			name: "alt",
			type: "text",
			label: "Что изображено",
			admin: {
				description:
					"Коротко опишите фотографию для людей, которые её не видят.",
			},
		},
		{ name: "caption", type: "text", label: "Подпись" },
		{
			name: "originalDownload",
			type: "ui",
			admin: {
				components: {
					Field: "/cms/components/OriginalDownload#OriginalDownload",
				},
			},
		},
		{
			name: "captionTrack",
			type: "textarea",
			label: "Субтитры WebVTT (для видео с речью)",
			maxLength: 100000,
			access: {
				read: ({ req }) =>
					isStaff(req.user) || req.context[CONTEXT.mediaFile] === true,
			},
			admin: {
				description:
					"Необязательно для видео без речи. Вставьте подготовленные субтитры, начинающиеся с WEBVTT.",
			},
			validate: (value: unknown) =>
				!value ||
				(typeof value === "string" && /^WEBVTT(?:\s|$)/.test(value)) ||
				"Текст субтитров должен начинаться с WEBVTT.",
		},
		internal({
			name: "hasCaptions",
			type: "checkbox",
			admin: { hidden: true },
		}),
		internal({
			name: "processingStatus",
			type: "select",
			label: "Готовность",
			defaultValue: MEDIA_STATUS.queued,
			admin: {
				components: {
					Field: "/cms/components/MediaProcessingStatus#MediaProcessingStatus",
				},
			},
			options: [
				{ label: "Ожидает обработки", value: MEDIA_STATUS.queued },
				{ label: "Обрабатывается", value: MEDIA_STATUS.processing },
				{ label: "Готово", value: MEDIA_STATUS.ready },
				{ label: "Ошибка обработки", value: MEDIA_STATUS.error },
			],
		}),
		internal({ name: "error", type: "textarea", label: "Причина ошибки" }),
		{
			name: "retry",
			type: "ui",
			admin: { components: { Field: "/cms/components/RetryMedia#RetryMedia" } },
		},
		{
			name: "archived",
			type: "checkbox",
			label: "Убрать в архив",
			defaultValue: false,
		},
		internal({
			name: "kind",
			type: "select",
			options: Object.values(MEDIA_KIND),
			admin: { hidden: true },
		}),
		internal({ name: "storageKey", type: "text", admin: { hidden: true } }),
		internal({ name: "derivativeKey", type: "text", admin: { hidden: true } }),
		internal({
			name: "duration",
			type: "number",
			label: "Длительность, секунд",
		}),
		internal({
			name: "optimizedBytes",
			type: "number",
			label: "Размер после обработки, байт",
		}),
	],
};
