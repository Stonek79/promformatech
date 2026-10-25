export const RUNTIME = {
	production: "production",
	buildPhase: "phase-production-build",
	defaultServerURL: "http://localhost:3000",
	buildServerURL: "https://build.invalid",
	buildDatabaseURL: "postgresql://build:build@127.0.0.1:1/build",
	buildSecret: "compile-time-placeholder-do-not-use-at-runtime",
	minimumSecretLength: 32,
	connectionTimeoutMilliseconds: 2000,
	idleTimeoutMilliseconds: 10_000,
	queryTimeoutMilliseconds: 30_000,
	migrationTimeoutMilliseconds: 120_000,
} as const;

export const PROCESS_ROLE = {
	web: "web",
	worker: "worker",
	migrator: "migrator",
} as const;
type ProcessRole = (typeof PROCESS_ROLE)[keyof typeof PROCESS_ROLE];
export const DATABASE_POOLS = {
	[PROCESS_ROLE.web]: 4,
	[PROCESS_ROLE.worker]: 3,
	[PROCESS_ROLE.migrator]: 2,
} as const;
const URL_PROTOCOL = {
	http: "http:",
	https: "https:",
	postgres: "postgres:",
	postgresql: "postgresql:",
} as const;
export const RUNTIME_ERRORS = {
	serverURL:
		"SERVER_URL должен быть полным HTTP(S)-адресом без пути, пароля и wildcard.",
	https: "В production SERVER_URL должен использовать HTTPS.",
	databaseURL: "Задайте корректный DATABASE_URL для PostgreSQL.",
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

export function getRuntimeConfig(
	environment: RuntimeEnvironment = process.env,
) {
	const build = isBuildPhase(environment);
	const databaseURL = build
		? RUNTIME.buildDatabaseURL
		: environment.DATABASE_URL;
	const database = parseURL(databaseURL, RUNTIME_ERRORS.databaseURL);
	const postgres = [URL_PROTOCOL.postgres, URL_PROTOCOL.postgresql].some(
		(protocol) => protocol === database.protocol,
	);
	if (!postgres) {
		throw new Error(RUNTIME_ERRORS.databaseURL);
	}
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
		databaseURL: database.toString(),
		secret,
		pool: {
			max: DATABASE_POOLS[role],
			connectionTimeoutMillis: RUNTIME.connectionTimeoutMilliseconds,
			idleTimeoutMillis: RUNTIME.idleTimeoutMilliseconds,
			statement_timeout:
				role === PROCESS_ROLE.migrator
					? RUNTIME.migrationTimeoutMilliseconds
					: RUNTIME.queryTimeoutMilliseconds,
		},
	};
}
