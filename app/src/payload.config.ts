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
import { MEDIA_POLICY, MEDIA_UPLOAD } from "./config/media";
import { getRuntimeConfig } from "./config/runtime";
import { ensureMediaStorage } from "./features/media/storage";
import { uploadDirectory } from "./features/media/upload-source";
import { DEFAULT_LOCALE, LOCALES } from "./i18n/config";
import { allowedOrigins, serverURL } from "./lib/urls";

const directory = path.dirname(fileURLToPath(import.meta.url));
const runtime = getRuntimeConfig();

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
		useTempFiles: true,
		tempFileDir: uploadDirectory(),
		uploadTimeout: MEDIA_UPLOAD.idleTimeoutMilliseconds,
		requestSizeLimit:
			MEDIA_POLICY.maxFileBytes +
			MEDIA_UPLOAD.fields * MEDIA_UPLOAD.fieldBytes +
			MEDIA_UPLOAD.boundaryBytes,
		limits: {
			fileSize: MEDIA_POLICY.maxFileBytes,
			files: MEDIA_UPLOAD.files,
			fields: MEDIA_UPLOAD.fields,
			fieldSize: MEDIA_UPLOAD.fieldBytes,
			fieldNameSize: MEDIA_UPLOAD.fieldNameBytes,
			parts: MEDIA_UPLOAD.files + MEDIA_UPLOAD.fields,
		},
		abortOnLimit: true,
	},
	onInit: async () => {
		await ensureMediaStorage();
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
		pool: { ...runtime.pool, connectionString: runtime.databaseURL },
		push: runtime.schemaPush,
		migrationDir: path.resolve(directory, "migrations"),
	}),
	graphQL: { disable: true },
	secret: runtime.secret,
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
