import { spawnSync } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { PAYLOAD_TYPE_PATHS } from "./lib/payload-type-paths.mjs";

function run(args) {
	const result = spawnSync("pnpm", args, { stdio: "inherit" });
	if (result.error || result.status !== 0) {
		throw new Error("Payload type generation failed", { cause: result.error });
	}
}

await mkdir(path.dirname(PAYLOAD_TYPE_PATHS.source), { recursive: true });
run(["exec", "payload", "generate:types"]);
await import("./split-payload-types.mjs");
run(["exec", "biome", "check", "--write", PAYLOAD_TYPE_PATHS.output]);
