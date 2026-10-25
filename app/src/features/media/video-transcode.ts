import path from "node:path";
import { MEDIA_POLICY } from "@/config/media";
import { MEDIA_VARIANTS } from "@/config/media-assets";
import { VIDEO_CODEC, VIDEO_POLICY, VIDEO_STRATEGY } from "@/config/video";
import { processCommand } from "./process-command";
import { frameRate, type VideoProbe, videoStream } from "./video-probe";

function encodingArguments(probe: VideoProbe) {
	const detectedRate = frameRate(videoStream(probe)?.avg_frame_rate);
	const outputRate =
		Number.isFinite(detectedRate) && detectedRate > 0
			? Math.min(detectedRate, VIDEO_POLICY.maximumFrameRate)
			: VIDEO_POLICY.maximumFrameRate;
	const squareAspect = "if(gt(sar,0),sar,1)";
	const displayRatio = `iw*${squareAspect}/ih`;
	const even = VIDEO_POLICY.divisibleBy;
	const boundedWidth = `min(iw*${squareAspect},min(${MEDIA_POLICY.videoWidth},${MEDIA_POLICY.videoHeight}*(${displayRatio})))`;
	const width = `max(${even},trunc((${boundedWidth})/${even})*${even})`;
	const height = `max(${even},trunc(ow/(${displayRatio})/${even})*${even})`;
	const resize = `scale=w='${width}':h='${height}',setsar=1`;
	return [
		"-vf",
		resize,
		"-c:v",
		"libx264",
		"-pix_fmt",
		VIDEO_CODEC.pixelFormat,
		"-preset",
		VIDEO_POLICY.preset,
		"-crf",
		String(MEDIA_POLICY.videoCrf),
		"-r",
		String(outputRate),
		"-maxrate",
		String(VIDEO_POLICY.maximumVideoBitrate),
		"-bufsize",
		VIDEO_POLICY.encoderBuffer,
		"-c:a",
		VIDEO_CODEC.audio,
		"-b:a",
		VIDEO_POLICY.audioBitrate,
		"-ac",
		String(VIDEO_POLICY.maximumAudioChannels),
		"-threads",
		String(MEDIA_POLICY.encoderThreads),
	];
}
export async function transcodeVideo(
	original: string,
	output: string,
	probe: VideoProbe,
	strategy: string,
) {
	const processing =
		strategy === VIDEO_STRATEGY.remux
			? ["-c", "copy"]
			: encodingArguments(probe);
	await processCommand(
		process.env.FFMPEG_PATH || VIDEO_POLICY.ffmpeg,
		[
			"-nostdin",
			"-v",
			"error",
			...VIDEO_POLICY.inputFlags,
			"-i",
			original,
			"-map",
			"0:v:0",
			"-map",
			"0:a:0?",
			"-map_metadata",
			"-1",
			...processing,
			"-movflags",
			"+faststart",
			output,
		],
		MEDIA_POLICY.processTimeoutMilliseconds,
	);
}
export async function createVideoPoster(output: string, directory: string) {
	await processCommand(
		process.env.FFMPEG_PATH || VIDEO_POLICY.ffmpeg,
		[
			"-nostdin",
			"-v",
			"error",
			...VIDEO_POLICY.inputFlags,
			"-i",
			output,
			"-frames:v",
			"1",
			"-vf",
			`scale='min(${MEDIA_POLICY.posterWidth},iw)':-2`,
			"-threads",
			String(MEDIA_POLICY.encoderThreads),
			path.join(directory, MEDIA_VARIANTS.poster.file),
		],
		MEDIA_POLICY.probeTimeoutMilliseconds,
	);
}
