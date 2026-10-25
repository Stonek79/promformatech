import { HEALTH } from "@/config/health";

export function GET() {
	return Response.json(
		{ status: HEALTH.status.live },
		{
			headers: { "Cache-Control": HEALTH.cacheControl },
		},
	);
}
