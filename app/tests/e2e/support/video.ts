import { spawnSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const VIDEO = {
	width: 160,
	height: 90,
	seconds: 1,
	timeout: 15_000,
	threads: 1,
} as const;

export async function createVideoFixture() {
	const directory = await mkdtemp(
		path.join(tmpdir(), "promformatech-video-test-"),
	);
	const file = path.join(directory, "sample.mp4");
	const result = spawnSync(
		process.env.FFMPEG_PATH || "ffmpeg",
		[
			"-v",
			"error",
			"-f",
			"lavfi",
			"-i",
			`color=c=black:s=${VIDEO.width}x${VIDEO.height}:d=${VIDEO.seconds}`,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-threads",
			String(VIDEO.threads),
			"-an",
			"-y",
			file,
		],
		{ encoding: "utf8", timeout: VIDEO.timeout },
	);
	if (result.error || result.status !== 0) {
		await rm(directory, { recursive: true, force: true });
		throw new Error(`Cannot create video fixture: ${result.stderr}`, {
			cause: result.error,
		});
	}
	return {
		file,
		cleanup: () => rm(directory, { recursive: true, force: true }),
	};
}
