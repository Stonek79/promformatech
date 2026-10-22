import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import {
	FixedToolbarFeature,
	lexicalEditor,
} from "@payloadcms/richtext-lexical";
import { ru } from "@payloadcms/translations/languages/ru";
import { buildConfig } from "payload";
import { ADMIN_HELP } from "@/config/help";
import { isOwner, ownerOnly } from "./cms/access";
import { Leads } from "./cms/collections/Leads";
import { Media } from "./cms/collections/Media";
import { Pages } from "./cms/collections/Pages";
import { Products } from "./cms/collections/Products";
import { Projects } from "./cms/collections/Projects";
import { RateLimits } from "./cms/collections/RateLimits";
import { Services } from "./cms/collections/Services";
import { Users } from "./cms/collections/Users";
import { emailAdapter } from "./cms/email";
import { ServiceSettings } from "./cms/globals/ServiceSettings";
import { SiteSettings } from "./cms/globals/SiteSettings";
import { notifyLeadTask } from "./cms/tasks/notify-lead";
import { processMediaTask } from "./cms/tasks/process-media";
import { MEDIA_POLICY } from "./config/media";
import { DEFAULT_LOCALE, LOCALES } from "./i18n/config";
import { allowedOrigins, serverURL } from "./lib/urls";

const directory = path.dirname(fileURLToPath(import.meta.url));
const databaseURL = process.env.DATABASE_URL;
const secret = process.env.PAYLOAD_SECRET;

if (!databaseURL || !secret) {
	throw new Error(
		"Не заданы DATABASE_URL или PAYLOAD_SECRET. Выполните pnpm env:init.",
	);
}

export default buildConfig({
	admin: {
		avatar: "default",
		user: Users.slug,
		importMap: {
			baseDir: directory,
			autoGenerate: false,
		},
		components: {
			providers: [
				"/cms/components/AdminMessagesProvider#AdminMessagesProvider",
			],
			actions: ["/cms/components/AppearanceAction#AppearanceAction"],
			beforeNavLinks: ["/cms/help/HelpNavLink#HelpNavLink"],
			views: {
				help: {
					Component: "/cms/help/HelpView#HelpView",
					path: ADMIN_HELP.path,
					exact: true,
					meta: { title: ADMIN_HELP.title },
				},
			},
			beforeDashboard: ["/cms/components/Dashboard#Dashboard"],
			graphics: { Logo: "/cms/components/CMSLogo#CMSLogo" },
		},
		meta: { titleSuffix: "— ПромФормаТех" },
	},
	collections: [
		Users,
		Pages,
		Products,
		Services,
		Projects,
		Media,
		Leads,
		RateLimits,
	],
	globals: [SiteSettings, ServiceSettings],
	i18n: {
		fallbackLanguage: DEFAULT_LOCALE,
		supportedLanguages: { [LOCALES.ru]: ru },
	},
	editor: lexicalEditor({
		features: ({ defaultFeatures }) => [
			...defaultFeatures.filter(
				(feature) =>
					!["upload", "relationship", "fixedToolbar"].includes(feature.key),
			),
			FixedToolbarFeature(),
		],
	}),
	email: await emailAdapter(),
	upload: {
		limits: { fileSize: MEDIA_POLICY.maxFileBytes },
		abortOnLimit: true,
	},
	jobs: {
		tasks: [processMediaTask, notifyLeadTask],
		enableConcurrencyControl: true,
		deleteJobOnComplete: true,
		access: { run: () => false, cancel: ({ req }) => isOwner(req.user) },
		jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
			...defaultJobsCollection,
			admin: { ...defaultJobsCollection.admin, hidden: true },
			access: {
				...defaultJobsCollection.access,
				create: ownerOnly,
				read: ownerOnly,
				update: ownerOnly,
				delete: ownerOnly,
			},
		}),
	},
	db: postgresAdapter({
		pool: { connectionString: databaseURL },
		push: process.env.NODE_ENV !== "production",
	}),
	graphQL: { disable: true },
	secret,
	serverURL: serverURL(),
	csrf: allowedOrigins(),
	typescript: {
		outputFile: path.resolve(
			directory,
			"../private/generated/payload-types.ts",
		),
		autoGenerate: false,
	},
});
