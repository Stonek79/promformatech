import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, expect, it } from "vitest";
import {
	processCommand,
	stopMediaProcesses,
} from "@/features/media/process-command";
import { processImage } from "@/features/media/process-image";
import { processVideo } from "@/features/media/process-video";

const directories: string[] = [];
async function fixture() {
	const directory = await mkdtemp(path.join(os.tmpdir(), "pf-media-test-"));
	directories.push(directory);
	const output = path.join(directory, "output");
	await mkdir(output);
	return { directory, output };
}
afterEach(async () => {
	stopMediaProcesses();
	await Promise.all(
		directories
			.splice(0)
			.map((directory) => rm(directory, { recursive: true, force: true })),
	);
});

it("creates image variants without enlargement or changing the source", async () => {
	const { directory, output } = await fixture();
	const original = path.join(directory, "input.png");
	const source = await sharp({
		create: { width: 240, height: 120, channels: 3, background: "#6293d5" },
	})
		.png()
		.toBuffer();
	await writeFile(original, source);
	const result = await processImage(original, output);
	for (const file of ["image.webp", "image-480.webp", "image-960.webp"]) {
		const metadata = await sharp(path.join(output, file)).metadata();
		expect([metadata.width, metadata.height]).toEqual([240, 120]);
	}
	expect(result.optimizedBytes).toBeGreaterThan(0);
	expect(await readFile(original)).toEqual(source);
});

it("produces a playable 4:2:0 portrait MP4 with correct proportions and poster", async () => {
	const { directory, output } = await fixture();
	const original = path.join(directory, "input.mp4");
	await processCommand(
		process.env.FFMPEG_PATH || "ffmpeg",
		[
			"-nostdin",
			"-v",
			"error",
			"-f",
			"lavfi",
			"-i",
			"testsrc2=size=960x1440:rate=10",
			"-t",
			"1",
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-threads",
			"1",
			original,
		],
		30_000,
	);
	const source = await readFile(original);
	const result = await processVideo(original, output);
	expect([result.width, result.height]).toEqual([720, 1080]);
	const probe = JSON.parse(
		await processCommand(
			process.env.FFPROBE_PATH || "ffprobe",
			[
				"-v",
				"error",
				"-show_entries",
				"stream=codec_name,pix_fmt",
				"-of",
				"json",
				path.join(output, "video.mp4"),
			],
			30_000,
		),
	);
	expect(probe.streams[0]).toMatchObject({
		codec_name: "h264",
		pix_fmt: "yuv420p",
	});
	expect(
		(await sharp(path.join(output, "poster.jpg")).metadata()).width,
	).toBeLessThanOrEqual(720);
	expect(await readFile(original)).toEqual(source);
});

it("rejects a corrupt source", async () => {
	const { directory, output } = await fixture();
	const original = path.join(directory, "broken.jpg");
	await writeFile(original, "not an image");
	await expect(processImage(original, output)).rejects.toThrow();
});

it("terminates a timed-out processing child", async () => {
	await expect(
		processCommand(process.execPath, ["-e", "setInterval(() => {}, 1000)"], 50),
	).rejects.toThrow("timed out");
});
