import { stat } from "node:fs/promises";
import path from "node:path";
import { MEDIA_KIND, MEDIA_POLICY, MEDIA_VARIANTS } from "@/config/media";
import { processCommand } from "./process-command";

type Probe = {
	format?: { duration?: string };
	streams?: {
		codec_type?: string;
		codec_name?: string;
		pix_fmt?: string;
		width?: number;
		height?: number;
	}[];
};
const MAX_SOURCE_WIDTH = 4096;
const MAX_SOURCE_HEIGHT = 2160;
const MAX_SOURCE_PIXELS = MAX_SOURCE_WIDTH * MAX_SOURCE_HEIGHT;
const INPUT_FLAGS = [
	"-protocol_whitelist",
	"file,pipe",
	"-format_whitelist",
	"mov,matroska,webm",
];

export async function processVideo(original: string, directory: string) {
	const ffprobe = process.env.FFPROBE_PATH || "ffprobe";
	const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
	const information: Probe = JSON.parse(
		await processCommand(
			ffprobe,
			[
				"-v",
				"error",
				...INPUT_FLAGS,
				"-show_entries",
				"format=duration:stream=codec_type,codec_name,pix_fmt,width,height",
				"-of",
				"json",
				original,
			],
			MEDIA_POLICY.probeTimeoutMilliseconds,
		),
	);
	const video = information.streams?.find(
		(stream) => stream.codec_type === MEDIA_KIND.video,
	);
	const duration = Number(information.format?.duration);
	if (
		!video?.width ||
		!video.height ||
		!Number.isFinite(duration) ||
		duration <= 0 ||
		duration > MEDIA_POLICY.maxVideoSeconds
	) {
		throw new Error("Unsupported video or duration limit exceeded");
	}
	if (video.width * video.height > MAX_SOURCE_PIXELS) {
		throw new Error("Video resolution exceeds 4K limit");
	}
	const output = path.join(directory, MEDIA_VARIANTS.video.file);
	const scale = `scale=w='min(${MEDIA_POLICY.videoWidth},iw)':h='min(${MEDIA_POLICY.videoHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2`;
	await processCommand(
		ffmpeg,
		[
			"-nostdin",
			"-v",
			"error",
			...INPUT_FLAGS,
			"-i",
			original,
			"-map",
			"0:v:0",
			"-map",
			"0:a:0?",
			"-map_metadata",
			"-1",
			"-vf",
			scale,
			"-c:v",
			"libx264",
			"-pix_fmt",
			"yuv420p",
			"-preset",
			"medium",
			"-crf",
			String(MEDIA_POLICY.videoCrf),
			"-c:a",
			"aac",
			"-b:a",
			"128k",
			"-threads",
			String(MEDIA_POLICY.encoderThreads),
			"-movflags",
			"+faststart",
			output,
		],
		MEDIA_POLICY.processTimeoutMilliseconds,
	);
	const audio = information.streams?.find(
		(stream) => stream.codec_type === "audio",
	);
	if (
		(await stat(output)).size > (await stat(original)).size &&
		video.codec_name === "h264" &&
		video.pix_fmt === "yuv420p" &&
		(!audio || audio.codec_name === "aac") &&
		video.width <= MEDIA_POLICY.videoWidth &&
		video.height <= MEDIA_POLICY.videoHeight
	) {
		await processCommand(
			ffmpeg,
			[
				"-nostdin",
				"-v",
				"error",
				...INPUT_FLAGS,
				"-i",
				original,
				"-map",
				"0:v:0",
				"-map",
				"0:a:0?",
				"-map_metadata",
				"-1",
				"-c",
				"copy",
				"-movflags",
				"+faststart",
				"-y",
				output,
			],
			MEDIA_POLICY.processTimeoutMilliseconds,
		);
	}
	await processCommand(
		ffmpeg,
		[
			"-nostdin",
			"-v",
			"error",
			"-i",
			output,
			"-frames:v",
			"1",
			"-vf",
			`scale='min(${MEDIA_POLICY.posterWidth},iw)':-2`,
			"-threads",
			"1",
			path.join(directory, MEDIA_VARIANTS.poster.file),
		],
		MEDIA_POLICY.probeTimeoutMilliseconds,
	);
	const result: Probe = JSON.parse(
		await processCommand(
			ffprobe,
			[
				"-v",
				"error",
				"-show_entries",
				"stream=codec_type,width,height",
				"-of",
				"json",
				output,
			],
			MEDIA_POLICY.probeTimeoutMilliseconds,
		),
	);
	const dimensions = result.streams?.find(
		(stream) => stream.codec_type === MEDIA_KIND.video,
	);
	if (!dimensions?.width || !dimensions.height) {
		throw new Error("Missing processed video dimensions");
	}
	return {
		kind: MEDIA_KIND.video,
		width: dimensions.width,
		height: dimensions.height,
		duration,
		optimizedBytes: (await stat(output)).size,
	};
}
