import type { GlobalConfig } from "payload";
import { GLOBALS } from "@/config/content";
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
