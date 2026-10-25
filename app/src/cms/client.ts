import config from "@payload-config";
import { getPayload } from "payload";
import { isBuildPhase, RUNTIME_ERRORS } from "@/config/runtime";

export function getCMS() {
	if (isBuildPhase()) {
		throw new Error(RUNTIME_ERRORS.buildRead);
	}
	return getPayload({ config });
}
