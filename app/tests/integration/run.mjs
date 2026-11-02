import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const parent = path.resolve("private/verification");
await mkdir(parent, { recursive: true });
const directory = await mkdtemp(path.join(parent, "sqlite-"));
const env = {
	...process.env,
	NODE_ENV: "production",
	NEXT_PHASE: "",
	SMTP_HOST: "",
	SMTP_FROM: "",
	DATABASE_URL: `file:${directory}/verification.sqlite`,
	MEDIA_ROOT: path.join(directory, "media"),
	SERVER_URL: "https://runtime.example.test",
	PAYLOAD_SECRET: randomBytes(32).toString("hex"),
	TEST_PASSWORD: randomBytes(24).toString("hex"),
	TEST_FIXTURE_FILE: path.join(directory, "fixture.json"),
};
function run(args, role = "web") {
	const result = spawnSync("pnpm", args, {
		env: { ...env, APP_PROCESS_ROLE: role },
		stdio: "inherit",
	});
	assert.equal(result.status, 0, `Verification failed: ${args.join(" ")}`);
}
try {
	run(["db:migrate"], "migrator");
	run(["db:migrate"], "migrator");
	run(["payload", "run", "tests/integration/setup.ts"]);
	run(["worker:once"], "worker");
	await delay(3100);
	run(["worker:once"], "worker");
	run(["payload", "run", "tests/integration/assert-content.ts"]);
	console.log(
		"SQLite: clean/idempotent migrations, login, drafts, versions, media and crash recovery passed.",
	);
} finally {
	await rm(directory, { recursive: true, force: true });
}
