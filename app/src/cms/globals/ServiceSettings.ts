import type { GlobalConfig } from "payload";
import { GLOBALS } from "@/config/content";
import { getArrayLabels } from "@/i18n/messages";
import { isOwner, ownerOnly } from "../access";
import { helpDescription } from "../help/config";

export const ServiceSettings: GlobalConfig = {
	slug: GLOBALS.service,
	label: "Служебные настройки",
	admin: {
		group: "Управление",
		hidden: ({ user }) => !isOwner(user),
		hideAPIURL: true,
		components: {
			elements: { Description: helpDescription(GLOBALS.service) },
		},
	},
	access: { read: ownerOnly, update: ownerOnly },
	fields: [
		{
			name: "recipients",
			type: "array",
			label: "Получатели уведомлений о заявках",
			labels: getArrayLabels("recipients"),
			fields: [
				{ name: "email", type: "email", label: "Email", required: true },
			],
		},
		{
			name: "retentionDays",
			type: "number",
			label: "Срок хранения заявок, дней",
			min: 7,
			max: 730,
			defaultValue: 90,
			admin: {
				description:
					"Очистка закрытых заявок выполняется отдельной служебной командой. Настройку согласует владелец.",
			},
		},
		{
			name: "environment",
			type: "ui",
			admin: {
				components: {
					Field: "/cms/components/EnvironmentStatus#EnvironmentStatus",
				},
			},
		},
	],
};
