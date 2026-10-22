import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { Payload } from "payload";
import { FORM_LIMITS } from "@/config/forms";
import { TIME_UNITS } from "@/config/units";

export function visitorKey(request: Request) {
	const forwarded =
		process.env.TRUST_PROXY_HEADERS === "true"
			? request.headers.get("x-real-ip")
			: null;
	const address =
		forwarded && isIP(forwarded) ? forwarded : "direct-connection";
	return createHmac("sha256", process.env.PAYLOAD_SECRET || "")
		.update(address)
		.digest("hex");
}

export async function allowInquiry(cms: Payload, key: string) {
	const resetAt = new Date(
		Date.now() + FORM_LIMITS.windowSeconds * TIME_UNITS.millisecondsPerSecond,
	);
	const result = await cms.db.pool.query(
		`INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, $2)
		 ON CONFLICT (key) DO UPDATE SET
		 count = CASE WHEN rate_limits.reset_at <= NOW() THEN 1 ELSE rate_limits.count + 1 END,
		 reset_at = CASE WHEN rate_limits.reset_at <= NOW() THEN $2 ELSE rate_limits.reset_at END
		 WHERE rate_limits.reset_at <= NOW() OR rate_limits.count < $3 RETURNING count`,
		[key, resetAt, FORM_LIMITS.requestsPerWindow],
	);
	return result.rowCount === 1;
}
