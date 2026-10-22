import { spawnSync } from "node:child_process";
import { expect } from "@playwright/test";

const WORKER_TIMEOUT = 60_000;

export function runWorker() {
	const result = spawnSync("pnpm", ["worker:once"], {
		env: process.env,
		encoding: "utf8",
		timeout: WORKER_TIMEOUT,
	});
	expect(result.status, result.stderr).toBe(0);
}
