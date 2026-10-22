import config from "@payload-config";
import { getPayload } from "payload";

export function getCMS() {
	return getPayload({ config });
}
