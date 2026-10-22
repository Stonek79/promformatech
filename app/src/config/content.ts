export const COLLECTIONS = {
	users: "users",
	pages: "pages",
	products: "products",
	services: "services",
	projects: "projects",
	media: "media",
	leads: "leads",
	rateLimits: "rate-limits",
} as const;

export const SYSTEM_COLLECTIONS = {
	kv: "payload-kv",
	jobs: "payload-jobs",
	lockedDocuments: "payload-locked-documents",
	preferences: "payload-preferences",
	migrations: "payload-migrations",
} as const;

export const GLOBALS = {
	site: "site-settings",
	service: "service-settings",
} as const;

export const ROLES = { owner: "owner", manager: "manager" } as const;
export const PUBLICATION = { draft: "draft", published: "published" } as const;
export const CONTEXT = {
	publicContent: "publicContent",
	mediaFile: "mediaFile",
	leadSubmission: "leadSubmission",
	bootstrap: "bootstrap",
} as const;

export const SHOWCASE_COLLECTIONS = [
	COLLECTIONS.products,
	COLLECTIONS.services,
	COLLECTIONS.projects,
] as const;
export type ShowcaseCollection = (typeof SHOWCASE_COLLECTIONS)[number];

export const PAGE_SLUGS = {
	home: "home",
	about: "about",
	products: "products",
	services: "services",
	projects: "projects",
	contacts: "contacts",
	privacy: "privacy",
} as const;

export const PAGE_KINDS = {
	content: "content",
	home: "home",
	products: "products",
	services: "services",
	projects: "projects",
	contacts: "contacts",
} as const;

export const ROUTES = {
	home: "/",
	about: `/${PAGE_SLUGS.about}`,
	products: `/${PAGE_SLUGS.products}`,
	services: `/${PAGE_SLUGS.services}`,
	projects: `/${PAGE_SLUGS.projects}`,
	admin: "/admin",
	api: "/api",
	media: "/media",
	uiKit: "/ui-kit",
	sitemap: "/sitemap.xml",
	preview: "/preview",
	exitPreview: "/api/preview/exit",
	search: "/search",
	contact: `/${PAGE_SLUGS.contacts}`,
	privacy: `/${PAGE_SLUGS.privacy}`,
	leads: "/api/inquiries",
} as const;

export const SHOWCASE_PATHS: Record<ShowcaseCollection, string> = {
	products: ROUTES.products,
	services: ROUTES.services,
	projects: ROUTES.projects,
};

export const CONTENT_CACHE = { tag: "cms-content", seconds: 300 } as const;
export const CONTENT_LIMITS = {
	pageSize: 100,
	versions: 30,
	previewDepth: 2,
	title: 180,
	summary: 600,
	searchQuery: 100,
	minimumSearchQuery: 2,
} as const;

export const AUTH = {
	sessionSeconds: 7200,
	minimumOwnerPasswordLength: 16,
	maxLoginAttempts: 5,
	lockMilliseconds: 600_000,
} as const;

export const ADMIN_BREAKPOINTS = [
	{ label: "Телефон", name: "mobile", width: 390, height: 844 },
	{ label: "Планшет", name: "tablet", width: 820, height: 1180 },
	{ label: "Десктоп", name: "desktop", width: 1440, height: 900 },
] as const;
