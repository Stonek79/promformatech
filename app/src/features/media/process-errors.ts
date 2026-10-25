import { PROCESS_FAILURE } from "@/config/jobs";

export class MediaProcessError extends Error {
	constructor(
		readonly kind: (typeof PROCESS_FAILURE)[keyof typeof PROCESS_FAILURE],
		message: string,
	) {
		super(message);
		this.name = "MediaProcessError";
	}
}

const TRANSIENT_CODES = new Set([
	"ECONNRESET",
	"ECONNREFUSED",
	"ETIMEDOUT",
	"EPIPE",
	"EAI_AGAIN",
	"57P01",
	"08006",
]);

export function retryableProcessingError(error: unknown) {
	if (error instanceof MediaProcessError) {
		return (
			error.kind === PROCESS_FAILURE.interrupted ||
			error.kind === PROCESS_FAILURE.timeout ||
			error.kind === PROCESS_FAILURE.spawn
		);
	}
	if (typeof error !== "object" || error === null || !("code" in error)) {
		return false;
	}
	return typeof error.code === "string" && TRANSIENT_CODES.has(error.code);
}
