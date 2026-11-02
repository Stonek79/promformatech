import { type AuthStrategyFunction, JWTAuthentication } from "payload";
import { LOCAL_HTTP_AUTH } from "@/config/security";

const authenticate: AuthStrategyFunction = (args) => {
	const { headers, req } = args;
	if (
		headers.has(LOCAL_HTTP_AUTH.originHeader) ||
		headers.has(LOCAL_HTTP_AUTH.fetchSiteHeader)
	) {
		return { user: null };
	}
	if (!headers.has(LOCAL_HTTP_AUTH.cookieHeader)) {
		return { user: null };
	}
	if (
		req?.method &&
		!LOCAL_HTTP_AUTH.readMethods.some((method) => method === req.method)
	) {
		return { user: null };
	}
	// Next's local auth calls may lack an HTTP method. External unsafe requests have one.
	const forwarded = new Headers(headers);
	forwarded.set(
		LOCAL_HTTP_AUTH.fetchSiteHeader,
		LOCAL_HTTP_AUTH.fetchSiteFallback,
	);
	return JWTAuthentication({
		...args,
		headers: forwarded,
		strategyName: LOCAL_HTTP_AUTH.jwtStrategy,
	});
};

export const localHttpAuthentication = {
	name: LOCAL_HTTP_AUTH.strategy,
	authenticate,
};
