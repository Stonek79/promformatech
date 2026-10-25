import { HTTP } from "@/config/forms";
import { HEALTH } from "@/config/health";
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
