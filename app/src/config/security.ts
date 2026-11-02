export const LOCAL_HTTP_AUTH = {
	enabled: "true",
	protocol: "http:",
	strategy: "local-http",
	jwtStrategy: "local-jwt",
	originHeader: "Origin",
	fetchSiteHeader: "Sec-Fetch-Site",
	cookieHeader: "Cookie",
	fetchSiteFallback: "same-origin",
	readMethods: ["GET", "HEAD"],
	loopbackNames: ["localhost", "[::1]"],
	privateIPv4:
		/^(?:(?:10|127)\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/,
	invalidConfiguration:
		"LOCAL_HTTP_AUTH разрешён только в разработке для HTTP-адреса локальной сети.",
} as const;
