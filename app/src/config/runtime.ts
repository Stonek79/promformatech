export const RUNTIME = {
	production: "production",
	buildPhase: "phase-production-build",
	defaultServerURL: "http://localhost:3000",
	buildServerURL: "https://build.invalid",
	buildDatabaseURL: "file:/build-placeholder/promformatech.sqlite",
	buildSecret: "compile-time-placeholder-do-not-use-at-runtime",
	minimumSecretLength: 32,
	databaseExtension: ".sqlite",
	absoluteFilePrefix: "file:/",
} as const;

export const PROCESS_ROLE = {
	web: "web",
	worker: "worker",
	migrator: "migrator",
} as const;
type ProcessRole = (typeof PROCESS_ROLE)[keyof typeof PROCESS_ROLE];
const URL_PROTOCOL = {
	http: "http:",
	https: "https:",
	file: "file:",
} as const;
export const RUNTIME_ERRORS = {
	serverURL:
		"SERVER_URL должен быть полным HTTP(S)-адресом без пути, пароля и wildcard.",
	https: "В production SERVER_URL должен использовать HTTPS.",
	databaseURL:
		"DATABASE_URL должен указывать на локальный SQLite-файл: file:./private/database/site.sqlite.",
	secret:
		"Задайте PAYLOAD_SECRET длиной минимум 32 символа; build-placeholder запрещён.",
	role: "APP_PROCESS_ROLE должен быть web, worker или migrator.",
	buildRead:
		"Чтение CMS во время сборки запрещено: данные нужны только в runtime.",
} as const;

export type RuntimeEnvironment = Readonly<Record<string, string | undefined>>;

export function isBuildPhase(environment: RuntimeEnvironment = process.env) {
	return environment.NEXT_PHASE === RUNTIME.buildPhase;
}

function parseURL(value: string | undefined, message: string) {
	try {
		return new URL(value || "");
	} catch {
		throw new Error(message);
	}
}

export function getServerURL(environment: RuntimeEnvironment = process.env) {
	if (isBuildPhase(environment)) {
		return RUNTIME.buildServerURL;
	}
	const production = environment.NODE_ENV === RUNTIME.production;
	const value =
		environment.SERVER_URL ||
		(production ? undefined : RUNTIME.defaultServerURL);
	const url = parseURL(value, RUNTIME_ERRORS.serverURL);
	const allowedProtocol = [URL_PROTOCOL.http, URL_PROTOCOL.https].some(
		(protocol) => protocol === url.protocol,
	);
	if (
		!allowedProtocol ||
		url.username ||
		url.password ||
		url.search ||
		url.hash
	) {
		throw new Error(RUNTIME_ERRORS.serverURL);
	}
	if (url.pathname !== "/" || url.hostname.includes("*")) {
		throw new Error(RUNTIME_ERRORS.serverURL);
	}
	if (production && url.protocol !== URL_PROTOCOL.https) {
		throw new Error(RUNTIME_ERRORS.https);
	}
	return url.origin;
}

function getProcessRole(environment: RuntimeEnvironment): ProcessRole {
	const role = environment.APP_PROCESS_ROLE || PROCESS_ROLE.web;
	switch (role) {
		case PROCESS_ROLE.web:
		case PROCESS_ROLE.worker:
		case PROCESS_ROLE.migrator:
			return role;
		default:
			throw new Error(RUNTIME_ERRORS.role);
	}
}

function getDatabaseURL(environment: RuntimeEnvironment) {
	const value = isBuildPhase(environment)
		? RUNTIME.buildDatabaseURL
		: environment.DATABASE_URL;
	if (!value) {
		throw new Error(RUNTIME_ERRORS.databaseURL);
	}
	const url = parseURL(value, RUNTIME_ERRORS.databaseURL);
	if (url.protocol !== URL_PROTOCOL.file || url.host) {
		throw new Error(RUNTIME_ERRORS.databaseURL);
	}
	if (url.search || url.hash) {
		throw new Error(RUNTIME_ERRORS.databaseURL);
	}
	if (!url.pathname.endsWith(RUNTIME.databaseExtension)) {
		throw new Error(RUNTIME_ERRORS.databaseURL);
	}
	if (
		environment.NODE_ENV === RUNTIME.production &&
		!value.startsWith(RUNTIME.absoluteFilePrefix)
	) {
		throw new Error(RUNTIME_ERRORS.databaseURL);
	}
	return value;
}

export function getRuntimeConfig(
	environment: RuntimeEnvironment = process.env,
) {
	const build = isBuildPhase(environment);
	const databaseURL = getDatabaseURL(environment);
	const secret = build ? RUNTIME.buildSecret : environment.PAYLOAD_SECRET;
	if (!secret || secret.length < RUNTIME.minimumSecretLength) {
		throw new Error(RUNTIME_ERRORS.secret);
	}
	if (!build && secret === RUNTIME.buildSecret) {
		throw new Error(RUNTIME_ERRORS.secret);
	}
	const role = getProcessRole(environment);
	return {
		build,
		role,
		production: environment.NODE_ENV === RUNTIME.production,
		schemaPush:
			!build &&
			environment.NODE_ENV !== RUNTIME.production &&
			role === PROCESS_ROLE.web,
		serverURL: getServerURL(environment),
		databaseURL,
		secret,
	};
}
