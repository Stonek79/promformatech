import { mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { VIDEO_STRATEGY } from "@/config/video";
import { processCommand } from "@/features/media/process-command";
import { processVideo } from "@/features/media/process-video";
import { videoStrategy } from "@/features/media/video-policy";
import { probeVideo } from "@/features/media/video-probe";

const directories: string[] = [];
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const TIMEOUT = 30_000;

async function fixture(extra: readonly string[] = []) {
	const directory = await mkdtemp(path.join(os.tmpdir(), "pf-video-strategy-"));
	directories.push(directory);
	const original = path.join(directory, "input.mp4"),
		output = path.join(directory, "output");
	await mkdir(output);
	await processCommand(
		FFMPEG,
		[
			"-nostdin",
			"-v",
			"error",
			"-f",
			"lavfi",
			"-i",
			"testsrc2=size=320x180:rate=25",
			"-t",
			"1",
			...extra,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-threads",
			"1",
			original,
		],
		TIMEOUT,
	);
	return { directory, original, output };
}
afterEach(async () => {
	for (const directory of directories.splice(0)) {
		await rm(directory, { recursive: true, force: true });
	}
});

async function streamHash(filename: string) {
	return processCommand(
		FFMPEG,
		[
			"-nostdin",
			"-v",
			"error",
			"-i",
			filename,
			"-map",
			"0:v:0",
			"-c",
			"copy",
			"-f",
			"hash",
			"-hash",
			"sha256",
			"pipe:1",
		],
		TIMEOUT,
	);
}

it("remux keeps the compressed H264 stream unchanged", async () => {
	const { original, output } = await fixture();
	expect(
		videoStrategy(await probeVideo(original), (await stat(original)).size),
	).toBe(VIDEO_STRATEGY.remux);
	await processVideo(original, output);
	expect(await streamHash(path.join(output, "video.mp4"))).toBe(
		await streamHash(original),
	);
});

it("encodes rotation into portrait pixels instead of retaining display metadata", async () => {
	const { directory, original, output } = await fixture();
	const rotated = path.join(directory, "rotated.mp4");
	await processCommand(
		FFMPEG,
		[
			"-nostdin",
			"-v",
			"error",
			"-display_rotation:v:0",
			"90",
			"-i",
			original,
			"-c",
			"copy",
			rotated,
		],
		TIMEOUT,
	);
	const result = await processVideo(rotated, output);
	expect(result.height).toBeGreaterThan(result.width);
});

it("normalizes anamorphic pixels without changing the display aspect ratio", async () => {
	const { original, output } = await fixture(["-vf", "setsar=2"]);
	const result = await processVideo(original, output);
	expect(result.width / result.height).toBeCloseTo(640 / 180, 2);
	expect(
		(await probeVideo(path.join(output, "video.mp4"))).streams[0]
			.sample_aspect_ratio,
	).toBe("1:1");
});
