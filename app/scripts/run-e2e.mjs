import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

await rm(".next-e2e", { recursive: true, force: true });
await rm("private/e2e-media", { recursive: true, force: true });
await mkdir("private/e2e", { recursive: true });
for (const suffix of ["", "-wal", "-shm"]) {
	await rm(`private/e2e/promformatech_e2e.sqlite${suffix}`, { force: true });
}
const env = {
	...process.env,
	DATABASE_URL: "file:./private/e2e/promformatech_e2e.sqlite",
	PAYLOAD_SECRET: randomBytes(32).toString("hex"),
	MEDIA_ROOT: "private/e2e-media",
	SERVER_URL: "http://127.0.0.1:3100",
	LOCAL_HTTP_AUTH: "true",
	TEST_PASSWORD: randomBytes(24).toString("hex"),
	NEXT_OUTPUT_DIR: ".next-e2e",
	SMTP_HOST: "",
	SMTP_FROM: "",
};
function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		stdio: "inherit",
		env,
		...options,
	});
	if (result.status !== 0) {
		throw new Error(`${command} failed (${result.status})`);
	}
}
run("pnpm", ["payload", "run", "tests/setup-e2e.ts"]);
const server = spawn(
	"pnpm",
	[
		"exec",
		"next",
		"dev",
		"--turbopack",
		"--hostname",
		"127.0.0.1",
		"--port",
		"3100",
	],
	{ env, stdio: "inherit", detached: true },
);
try {
	let ready = false;
	for (let attempt = 0; attempt < 120; attempt++) {
		try {
			const response = await fetch(env.SERVER_URL);
			if (response.ok) {
				ready = true;
				break;
			}
		} catch {
			/* Wait for the owned server only. */
		}
		if (server.exitCode !== null) {
			throw new Error("Test server stopped unexpectedly");
		}
		await delay(1000);
	}
	if (!ready) {
		throw new Error("Test server did not become ready");
	}
	run("pnpm", ["exec", "playwright", "test", ...process.argv.slice(2)]);
} finally {
	try {
		process.kill(-server.pid, "SIGTERM");
	} catch {
		/* Already stopped. */
	}
}
