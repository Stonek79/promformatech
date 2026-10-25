import { MEDIA_POLICY } from "@/config/media";
import { VIDEO_POLICY, VIDEO_STREAM } from "@/config/video";
import { processCommand } from "./process-command";

export type VideoStream = {
	codec_type?: string;
	codec_name?: string;
	pix_fmt?: string;
	width?: number;
	height?: number;
	avg_frame_rate?: string;
	bit_rate?: string;
	profile?: string;
	level?: number;
	sample_aspect_ratio?: string;
	channels?: number;
	tags?: { rotate?: string };
	side_data_list?: { rotation?: number }[];
};
export type VideoProbe = {
	format?: { duration?: string; bit_rate?: string };
	streams: VideoStream[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
function stringField(value: Record<string, unknown>, key: string) {
	return typeof value[key] === "string" ? value[key] : undefined;
}
function numberField(value: Record<string, unknown>, key: string) {
	return typeof value[key] === "number" ? value[key] : undefined;
}
function parseStream(value: unknown): VideoStream | undefined {
	if (!isRecord(value) || typeof value.codec_type !== "string") {
		return;
	}
	const tags = isRecord(value.tags) ? value.tags : {};
	const sideData = Array.isArray(value.side_data_list)
		? value.side_data_list
		: [];
	return {
		codec_type: value.codec_type,
		codec_name: stringField(value, "codec_name"),
		pix_fmt: stringField(value, "pix_fmt"),
		width: numberField(value, "width"),
		height: numberField(value, "height"),
		avg_frame_rate: stringField(value, "avg_frame_rate"),
		bit_rate: stringField(value, "bit_rate"),
		profile: stringField(value, "profile"),
		level: numberField(value, "level"),
		sample_aspect_ratio: stringField(value, "sample_aspect_ratio"),
		channels: numberField(value, "channels"),
		tags: { rotate: stringField(tags, "rotate") },
		side_data_list: sideData
			.filter(isRecord)
			.map((entry) => ({ rotation: numberField(entry, "rotation") })),
	};
}
function parseProbe(text: string): VideoProbe {
	const value: unknown = JSON.parse(text);
	if (!isRecord(value) || !Array.isArray(value.streams)) {
		throw new Error("Invalid video probe result");
	}
	const format = isRecord(value.format) ? value.format : {};
	return {
		format: {
			duration:
				typeof format.duration === "string" ? format.duration : undefined,
			bit_rate:
				typeof format.bit_rate === "string" ? format.bit_rate : undefined,
		},
		streams: value.streams
			.map(parseStream)
			.filter((stream) => stream !== undefined),
	};
}
export function videoStream(probe: VideoProbe) {
	return probe.streams.find(
		(stream) => stream.codec_type === VIDEO_STREAM.video,
	);
}
export function frameRate(value: string | undefined) {
	if (!value) {
		return Number.NaN;
	}
	const [numerator, denominator] = value.split("/").map(Number);
	return numerator / (denominator ?? 1);
}
export async function probeVideo(filename: string) {
	return parseProbe(
		await processCommand(
			process.env.FFPROBE_PATH || VIDEO_POLICY.ffprobe,
			[
				"-v",
				"error",
				...VIDEO_POLICY.inputFlags,
				"-show_entries",
				VIDEO_POLICY.probeEntries,
				"-of",
				"json",
				filename,
			],
			MEDIA_POLICY.probeTimeoutMilliseconds,
		),
	);
}
