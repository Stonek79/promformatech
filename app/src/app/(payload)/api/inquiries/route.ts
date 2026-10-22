import { draftMode } from "next/headers";
import { getCMS } from "@/cms/client";
import { COLLECTIONS, CONTEXT } from "@/config/content";
import { FORM_LIMITS, HTTP } from "@/config/forms";
import { allowInquiry, visitorKey } from "@/features/leads/rate-limit";
import { RequestBodyError, readInquiryBody } from "@/features/leads/read-body";
import {
	InquiryValidationError,
	parseInquiry,
} from "@/features/leads/validation";
import { allowedOrigins } from "@/lib/urls";

export async function POST(request: Request) {
	const origin = request.headers.get("origin");
	if (
		!origin ||
		!allowedOrigins().includes(origin) ||
		(await draftMode()).isEnabled
	) {
		return Response.json({ code: "forbidden" }, { status: HTTP.forbidden });
	}
	try {
		const input = parseInquiry(await readInquiryBody(request));
		const cms = await getCMS();
		const context = { [CONTEXT.leadSubmission]: true };
		const existing = await cms.count({
			collection: COLLECTIONS.leads,
			overrideAccess: false,
			context,
			where: { requestID: { equals: input.requestID } },
		});
		if (existing.totalDocs > 0) {
			return Response.json({ success: true });
		}
		if (!(await allowInquiry(cms, visitorKey(request)))) {
			return Response.json(
				{ code: "rate_limit" },
				{
					status: HTTP.tooManyRequests,
					headers: { "Retry-After": String(FORM_LIMITS.windowSeconds) },
				},
			);
		}
		await cms.create({
			collection: COLLECTIONS.leads,
			data: input,
			overrideAccess: false,
			context,
		});
		return Response.json({ success: true }, { status: HTTP.created });
	} catch (error) {
		if (error instanceof InquiryValidationError) {
			return Response.json(
				{ code: "invalid_input", field: error.field },
				{ status: HTTP.badRequest },
			);
		}
		if (error instanceof RequestBodyError) {
			return Response.json({ code: "invalid_body" }, { status: error.status });
		}
		return Response.json({ code: "unavailable" }, { status: HTTP.unavailable });
	}
}
