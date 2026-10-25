import { getRuntimeConfig, isBuildPhase } from "./config/runtime";

export async function register() {
	if (process.env.NEXT_RUNTIME !== "nodejs" || isBuildPhase()) {
		return;
	}
	getRuntimeConfig();
	const { ensureMediaStorage } = await import("./features/media/storage");
	await ensureMediaStorage();
}
