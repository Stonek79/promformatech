import type { GlobalConfig } from "payload";
import {
	ADMIN_BREAKPOINTS,
	CONTENT_LIMITS,
	GLOBALS,
	PUBLICATION,
} from "@/config/content";
import { parseLocale } from "@/i18n/config";
import { isStaff, staffOnly } from "../access";
import { mediaReferencesField } from "../fields/common";
import { helpDescription } from "../help/config";
import {
	invalidatePublishedContent,
	protectGlobalDrafts,
	validateGlobalPublication,
} from "../hooks/content";
import { previewURL } from "../preview";
import {
	brandFields,
	contactFields,
	interfaceFields,
	navigationFields,
} from "./site-fields";

export const SiteSettings: GlobalConfig = {
	slug: GLOBALS.site,
	label: "Общие данные сайта",
	admin: {
		hideAPIURL: true,
		components: {
			elements: { Description: helpDescription(GLOBALS.site) },
		},
		group: "Содержание сайта",
		preview: (_, { locale }) =>
			previewURL({ global: GLOBALS.site, locale: parseLocale(locale) }),
		livePreview: {
			url: ({ locale }) =>
				previewURL({ global: GLOBALS.site, locale: parseLocale(locale.code) }),
			breakpoints: [...ADMIN_BREAKPOINTS],
		},
	},
	access: {
		read: () => true,
		update: staffOnly,
		readVersions: ({ req }) => isStaff(req.user),
	},
	versions: { drafts: true, max: CONTENT_LIMITS.versions },
	hooks: {
		afterRead: [
			({ doc, overrideAccess, req }) =>
				!overrideAccess &&
				!isStaff(req.user) &&
				doc._status !== PUBLICATION.published
					? { id: doc.id, companyName: "", _status: PUBLICATION.draft }
					: doc,
		],
		beforeOperation: [protectGlobalDrafts],
		beforeChange: [validateGlobalPublication],
		afterChange: [
			({ doc }) => {
				invalidatePublishedContent();
				return doc;
			},
		],
	},
	fields: [
		{
			type: "tabs",
			tabs: [
				{ label: "Компания", fields: brandFields },
				{ label: "Контакты", fields: contactFields },
				{ label: "Меню и подвал", fields: navigationFields },
				{ label: "Подписи и SEO", fields: interfaceFields },
			],
		},
		mediaReferencesField(),
	],
};
