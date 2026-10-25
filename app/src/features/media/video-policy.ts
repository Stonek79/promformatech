import { MEDIA_POLICY } from "@/config/media";
import {
	VIDEO_CODEC,
	VIDEO_POLICY,
	VIDEO_STRATEGY,
	VIDEO_STREAM,
} from "@/config/video";
import {
	frameRate,
	type VideoProbe,
	type VideoStream,
	videoStream,
} from "./video-probe";

function positive(value: number) {
	return Number.isFinite(value) && value > 0;
}
export function videoInformation(probe: VideoProbe) {
	const video = videoStream(probe);
	if (!video?.width || !video.height) {
		throw new Error("Missing video dimensions");
	}
	if (!positive(video.width) || !positive(video.height)) {
		throw new Error("Invalid video dimensions");
	}
	const duration = Number(probe.format?.duration);
	if (!positive(duration) || duration > MEDIA_POLICY.maxVideoSeconds) {
		throw new Error("Unsupported video duration");
	}
	const longest = Math.max(video.width, video.height),
		shortest = Math.min(video.width, video.height);
	if (
		longest > VIDEO_POLICY.maximumSourceEdge ||
		shortest > VIDEO_POLICY.maximumSourceShortEdge
	) {
		throw new Error("Video resolution exceeds 4K limit");
	}
	return { video, width: video.width, height: video.height, duration };
}
function hasRotation(stream: VideoStream) {
	if (Number(stream.tags?.rotate || 0) !== 0) {
		return true;
	}
	return Boolean(
		stream.side_data_list?.some((entry) => Number(entry.rotation || 0) !== 0),
	);
}
function compatibleVideo(stream: VideoStream, width: number, height: number) {
	if (
		stream.codec_name !== VIDEO_CODEC.video ||
		stream.pix_fmt !== VIDEO_CODEC.pixelFormat
	) {
		return false;
	}
	if (!VIDEO_POLICY.profiles.some((profile) => profile === stream.profile)) {
		return false;
	}
	const level = stream.level || 0;
	if (
		!positive(level) ||
		level > VIDEO_POLICY.maximumLevel ||
		hasRotation(stream)
	) {
		return false;
	}
	if (stream.sample_aspect_ratio !== VIDEO_POLICY.squarePixels) {
		return false;
	}
	if (width % VIDEO_POLICY.divisibleBy || height % VIDEO_POLICY.divisibleBy) {
		return false;
	}
	if (width > MEDIA_POLICY.videoWidth || height > MEDIA_POLICY.videoHeight) {
		return false;
	}
	const fps = frameRate(stream.avg_frame_rate);
	return positive(fps) && fps <= VIDEO_POLICY.maximumFrameRate;
}
function compatibleAudio(probe: VideoProbe) {
	const audio = probe.streams.find(
		(stream) => stream.codec_type === VIDEO_STREAM.audio,
	);
	if (!audio) {
		return true;
	}
	if (audio.codec_name !== VIDEO_CODEC.audio || !audio.channels) {
		return false;
	}
	const bitrate = Number(audio.bit_rate);
	return (
		positive(audio.channels) &&
		audio.channels <= VIDEO_POLICY.maximumAudioChannels &&
		positive(bitrate) &&
		bitrate <= VIDEO_POLICY.maximumAudioBitrate
	);
}
export function videoStrategy(probe: VideoProbe, originalBytes: number) {
	const information = videoInformation(probe);
	if (
		!compatibleVideo(information.video, information.width, information.height)
	) {
		return VIDEO_STRATEGY.encode;
	}
	if (!compatibleAudio(probe)) {
		return VIDEO_STRATEGY.encode;
	}
	const bitrate =
		Number(probe.format?.bit_rate) ||
		(originalBytes * VIDEO_POLICY.bitsPerByte) / information.duration;
	if (!positive(bitrate) || bitrate > VIDEO_POLICY.maximumContainerBitrate) {
		return VIDEO_STRATEGY.encode;
	}
	const videoBitrate = Number(information.video.bit_rate) || bitrate;
	return positive(videoBitrate) &&
		videoBitrate <= VIDEO_POLICY.maximumVideoBitrate
		? VIDEO_STRATEGY.remux
		: VIDEO_STRATEGY.encode;
}
