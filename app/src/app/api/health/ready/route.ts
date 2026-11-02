import { HEALTH } from "@/config/health";
import { HTTP } from "@/config/http";
import { isReady } from "@/features/health/readiness";

export async function GET() {
	const ready = await isReady();
	return Response.json(
		{ status: ready ? HEALTH.status.ready : HEALTH.status.unavailable },
		{
			status: ready ? HTTP.ok : HTTP.unavailable,
			headers: { "Cache-Control": HEALTH.cacheControl },
		},
	);
}
