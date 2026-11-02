import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Payload } from "payload";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { recoverInterruptedJobs } from "@/cms/jobs/recover-jobs";
import { acquireWorker } from "@/cms/jobs/worker-lock";

vi.mock("@/cms/jobs/recover-jobs", () => ({ recoverInterruptedJobs: vi.fn() }));
let directory: string;
const cms = {} as Payload;
beforeEach(async () => {
	vi.mocked(recoverInterruptedJobs).mockReset();
	directory = await mkdtemp(path.join(os.tmpdir(), "pft-lock-"));
	const file = path.join(directory, "test.sqlite");
	await writeFile(file, "");
	vi.stubEnv("DATABASE_URL", `file:${file}`);
	vi.stubEnv(
		"PAYLOAD_SECRET",
		"isolated-worker-lock-test-secret-32-characters",
	);
});
afterEach(async () => {
	vi.unstubAllEnvs();
	await rm(directory, { recursive: true, force: true });
});
it("rejects a second worker before recovery and allows it after release", async () => {
	const release = await acquireWorker(cms);
	try {
		await expect(acquireWorker(cms)).rejects.toThrow();
		expect(recoverInterruptedJobs).toHaveBeenCalledOnce();
	} finally {
		await release();
	}
	await (await acquireWorker(cms))();
});
it("releases ownership if recovery fails", async () => {
	vi.mocked(recoverInterruptedJobs).mockRejectedValueOnce(
		new Error("recovery failed"),
	);
	await expect(acquireWorker(cms)).rejects.toThrow("recovery failed");
	await (await acquireWorker(cms))();
});
