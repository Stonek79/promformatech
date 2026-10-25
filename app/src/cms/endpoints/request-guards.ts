import { APIError, type PayloadRequest } from "payload";
import { HTTP } from "@/config/forms";
import { isStaff } from "../access";

export function requireStaffRequest(req: PayloadRequest): void {
	if (!isStaff(req.user)) {
		throw new APIError("Требуется вход.", HTTP.unauthorized);
	}
}

export function parsePositiveRouteID(
	value: unknown,
	notFoundMessage: string,
): number {
	const id = Number(value);
	if (!Number.isSafeInteger(id) || id <= 0) {
		throw new APIError(notFoundMessage, HTTP.notFound);
	}
	return id;
}
