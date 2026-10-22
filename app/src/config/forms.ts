export const LEAD_STATUS = {
	fresh: "new",
	active: "active",
	closed: "closed",
	spam: "spam",
} as const;
export const NOTIFICATION_STATUS = {
	pending: "pending",
	sent: "sent",
	failed: "failed",
	unconfigured: "unconfigured",
} as const;
export const FORM_LIMITS = {
	minimumNameLength: 2,
	minimumPhoneDigits: 7,
	maximumPhoneDigits: 15,
	name: 100,
	contact: 200,
	message: 3000,
	bodyBytes: 12_288,
	requestsPerWindow: 5,
	windowSeconds: 3600,
	requestTimeoutMilliseconds: 30_000,
} as const;

export const HTTP = {
	ok: 200,
	created: 201,
	badRequest: 400,
	unauthorized: 401,
	forbidden: 403,
	notFound: 404,
	conflict: 409,
	tooLarge: 413,
	rangeNotSatisfiable: 416,
	tooManyRequests: 429,
	unavailable: 503,
	partialContent: 206,
} as const;
