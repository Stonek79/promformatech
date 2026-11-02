export const HEALTH = {
	status: { live: "live", ready: "ready", unavailable: "unavailable" },
	cacheControl: "no-store",
	deadlineMilliseconds: 3000,
	select: "SELECT 1",
	migrations: "SELECT name, batch FROM payload_migrations ORDER BY name",
} as const;
