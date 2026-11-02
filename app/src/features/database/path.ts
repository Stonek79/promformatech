import path from "node:path";
import { fileURLToPath } from "node:url";
import { DATABASE } from "@/config/database";
import { getRuntimeConfig } from "@/config/runtime";

export function databasePath() {
	const { databaseURL } = getRuntimeConfig();
	return databaseURL.startsWith("file:/")
		? fileURLToPath(databaseURL)
		: path.resolve(databaseURL.slice(DATABASE.urlPrefix.length));
}
