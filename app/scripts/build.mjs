import { spawnSync } from "node:child_process";
import { RUNTIME } from "../src/config/runtime.ts";

const environment = {
	...process.env,
	NEXT_PHASE: RUNTIME.buildPhase,
	DATABASE_URL: RUNTIME.buildDatabaseURL,
	PAYLOAD_SECRET: RUNTIME.buildSecret,
	SERVER_URL: RUNTIME.buildServerURL,
	SMTP_HOST: "",
	SMTP_FROM: "",
};

const TYPECHECK_ARGUMENT = "--types";
const commands = process.argv.includes(TYPECHECK_ARGUMENT)
	? [["exec", "next", "typegen"]]
	: [["prepare:app"], ["exec", "next", "build", "--turbopack"]];

for (const args of commands) {
	const result = spawnSync("pnpm", args, {
		env: environment,
		stdio: "inherit",
	});
	if (result.error) {
		throw result.error;
	}
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}
