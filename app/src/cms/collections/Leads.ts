import type { CollectionConfig } from "payload";
import { COLLECTIONS, CONTEXT } from "@/config/content";
import { FORM_LIMITS, LEAD_STATUS, NOTIFICATION_STATUS } from "@/config/forms";
import { isStaff, ownerOnly, staffOnly } from "../access";
import { retryNotification } from "../endpoints/retry-notification";
import { helpDescription } from "../help/config";
import { queueLeadNotification } from "../hooks/leads";

const preserveSubmission = { update: () => false };

export const Leads: CollectionConfig = {
	slug: COLLECTIONS.leads,
	labels: { singular: "Заявка", plural: "Заявки" },
	defaultSort: "-createdAt",
	admin: {
		hideAPIURL: true,
		components: { Description: helpDescription(COLLECTIONS.leads) },
		group: "Работа с клиентами",
		useAsTitle: "name",
		defaultColumns: [
			"name",
			"createdAt",
			"contact",
			"status",
			"notificationStatus",
		],
	},
	access: {
		create: ({ req }) => req.context[CONTEXT.leadSubmission] === true,
		read: ({ req }) =>
			isStaff(req.user) || req.context[CONTEXT.leadSubmission] === true,
		update: staffOnly,
		delete: ownerOnly,
	},
	endpoints: [
		{ path: "/:id/notify", method: "post", handler: retryNotification },
	],
	hooks: { afterChange: [queueLeadNotification] },
	fields: [
		{
			name: "name",
			type: "text",
			label: "Имя",
			required: true,
			maxLength: FORM_LIMITS.name,
			access: preserveSubmission,
		},
		{
			name: "contact",
			type: "text",
			label: "Телефон или email",
			required: true,
			maxLength: FORM_LIMITS.contact,
			access: preserveSubmission,
		},
		{
			name: "message",
			type: "textarea",
			label: "Сообщение",
			maxLength: FORM_LIMITS.message,
			access: preserveSubmission,
		},
		{
			name: "sourcePath",
			type: "text",
			label: "Страница обращения",
			access: preserveSubmission,
		},
		{
			name: "consent",
			type: "checkbox",
			label: "Согласие на обработку данных",
			required: true,
			access: preserveSubmission,
		},
		{
			name: "status",
			type: "select",
			label: "Статус",
			defaultValue: LEAD_STATUS.fresh,
			options: [
				{ label: "Новая", value: LEAD_STATUS.fresh },
				{ label: "В работе", value: LEAD_STATUS.active },
				{ label: "Закрыта", value: LEAD_STATUS.closed },
				{ label: "Спам", value: LEAD_STATUS.spam },
			],
		},
		{ name: "comment", type: "textarea", label: "Комментарий менеджера" },
		{
			name: "notificationStatus",
			type: "select",
			label: "Уведомление по почте",
			defaultValue: NOTIFICATION_STATUS.pending,
			access: { create: () => false, update: () => false },
			admin: { readOnly: true },
			options: [
				{ label: "Ожидает отправки", value: NOTIFICATION_STATUS.pending },
				{ label: "Отправлено", value: NOTIFICATION_STATUS.sent },
				{
					label: "Ошибка — можно повторить",
					value: NOTIFICATION_STATUS.failed,
				},
				{
					label: "Почта или получатели не настроены",
					value: NOTIFICATION_STATUS.unconfigured,
				},
			],
		},
		{
			name: "retryNotification",
			type: "ui",
			admin: {
				components: {
					Field: "/cms/components/RetryNotification#RetryNotification",
				},
			},
		},
		{
			name: "requestID",
			type: "text",
			required: true,
			unique: true,
			admin: { hidden: true },
			access: preserveSubmission,
		},
	],
};
