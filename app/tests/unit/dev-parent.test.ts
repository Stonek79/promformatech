import { spawn } from "node:child_process";
import { once } from "node:events";
import { expect, it } from "vitest";

const WATCH_PARENT = new URL(
	"../../scripts/lib/watch-dev-parent.mjs",
	import.meta.url,
);
const WORKER = `
	process.on("SIGTERM", () => process.exit(0));
	process.send("ready");
`;

it("lets a dev child shut down gracefully when its parent connection closes", async () => {
	const child = spawn(
		process.execPath,
		["--import", WATCH_PARENT.href, "--eval", WORKER],
		{ stdio: ["ignore", "ignore", "ignore", "ipc"] },
	);
	const exited = once(child, "exit");
	try {
		const [message] = await Promise.race([once(child, "message"), exited]);
		expect(message).toBe("ready");
		child.disconnect();
		await expect(exited).resolves.toEqual([0, null]);
	} finally {
		child.kill("SIGKILL");
	}
});
