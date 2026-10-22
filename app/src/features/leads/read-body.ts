import { FORM_LIMITS, HTTP } from "@/config/forms";

export class RequestBodyError extends Error {
	constructor(readonly status: number) {
		super("Invalid request body");
	}
}

export async function readInquiryBody(request: Request): Promise<unknown> {
	if (
		!request.headers.get("content-type")?.startsWith("application/json") ||
		!request.body
	) {
		throw new RequestBodyError(HTTP.badRequest);
	}
	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let bytes = 0;
	try {
		while (true) {
			const result = await reader.read();
			if (result.done) {
				break;
			}
			bytes += result.value.byteLength;
			if (bytes > FORM_LIMITS.bodyBytes) {
				await reader.cancel();
				throw new RequestBodyError(HTTP.tooLarge);
			}
			chunks.push(result.value);
		}
	} finally {
		reader.releaseLock();
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString("utf8"));
	} catch {
		throw new RequestBodyError(HTTP.badRequest);
	}
}
