import type { Payload } from "payload";
import { beforeEach, expect, it, vi } from "vitest";
import { recoverInterruptedJobs } from "@/cms/jobs/recover-jobs";
import { acquireWorker } from "@/cms/jobs/worker-lock";

vi.mock("@/cms/jobs/recover-jobs", () => ({ recoverInterruptedJobs: vi.fn() }));

function fixture() {
	const connection = {
		query: vi.fn(async (_sql: string) => ({ rows: [{ locked: true }] })),
		release: vi.fn(),
		on: vi.fn(),
		removeListener: vi.fn(),
	};
	const cms = {
		db: { pool: { connect: async () => connection } },
	} as unknown as Payload;
	return { cms, connection };
}
beforeEach(() => {
	vi.mocked(recoverInterruptedJobs).mockReset();
});

it("releases the connection when lock acquisition fails", async () => {
	const { cms, connection } = fixture();
	connection.query.mockRejectedValueOnce(new Error("connection unavailable"));
	await expect(acquireWorker(cms)).rejects.toThrow("connection unavailable");
	expect(connection.release).toHaveBeenCalledOnce();
	expect(recoverInterruptedJobs).not.toHaveBeenCalled();
});
it("does not recover jobs under a competing worker", async () => {
	const { cms, connection } = fixture();
	connection.query.mockResolvedValueOnce({ rows: [{ locked: false }] });
	await expect(acquireWorker(cms)).rejects.toThrow();
	expect(connection.release).toHaveBeenCalledOnce();
	expect(recoverInterruptedJobs).not.toHaveBeenCalled();
});
it("unlocks and releases ownership even when job recovery fails", async () => {
	const { cms, connection } = fixture();
	vi.mocked(recoverInterruptedJobs).mockRejectedValueOnce(
		new Error("recovery failed"),
	);
	await expect(acquireWorker(cms)).rejects.toThrow("recovery failed");
	expect(connection.query).toHaveBeenCalledTimes(2);
	expect(connection.release).toHaveBeenCalledOnce();
});
it("release is idempotent and discards a connection if unlock fails", async () => {
	const { cms, connection } = fixture();
	const release = await acquireWorker(cms);
	const error = new Error("unlock failed");
	connection.query.mockRejectedValueOnce(error);
	await expect(release()).rejects.toThrow("unlock failed");
	await release();
	expect(connection.release).toHaveBeenCalledExactlyOnceWith(error);
});
