import { expect, it } from "vitest";
import { VIDEO_STRATEGY } from "@/config/video";
import { videoInformation, videoStrategy } from "@/features/media/video-policy";
import { frameRate, type VideoProbe } from "@/features/media/video-probe";

const PROBE: VideoProbe = {
	format: { duration: "10", bit_rate: "2000000" },
	streams: [
		{
			codec_type: "video",
			codec_name: "h264",
			pix_fmt: "yuv420p",
			width: 1280,
			height: 720,
			avg_frame_rate: "25/1",
			profile: "High",
			level: 31,
			sample_aspect_ratio: "1:1",
			bit_rate: "1800000",
		},
	],
};
const ORIGINAL_BYTES = 2_500_000;

it("remuxes a compatible video before encoding, including silent video", () => {
	expect(videoStrategy(PROBE, ORIGINAL_BYTES)).toBe(VIDEO_STRATEGY.remux);
});
it.each([
	{ codec_name: "hevc" },
	{ pix_fmt: "yuv420p10le" },
	{ width: 2560 },
	{ width: 1279 },
	{ avg_frame_rate: "60/1" },
	{ sample_aspect_ratio: "2:1" },
	{ level: 51 },
	{ tags: { rotate: "90" } },
	{ side_data_list: [{ rotation: -90 }] },
	{ bit_rate: "9000000" },
])("encodes incompatible stream properties: %j", (properties) => {
	const probe = { ...PROBE, streams: [{ ...PROBE.streams[0], ...properties }] };
	expect(videoStrategy(probe, ORIGINAL_BYTES)).toBe(VIDEO_STRATEGY.encode);
});
it("encodes unsupported audio and excessive container bitrate", () => {
	expect(
		videoStrategy(
			{
				...PROBE,
				streams: [
					...PROBE.streams,
					{ codec_type: "audio", codec_name: "opus", channels: 2 },
				],
			},
			ORIGINAL_BYTES,
		),
	).toBe(VIDEO_STRATEGY.encode);
	expect(
		videoStrategy(
			{ ...PROBE, format: { duration: "10", bit_rate: "10000000" } },
			ORIGINAL_BYTES,
		),
	).toBe(VIDEO_STRATEGY.encode);
});
it("rejects an invalid duration and source above 4K", () => {
	expect(() =>
		videoInformation({ ...PROBE, format: { duration: "901" } }),
	).toThrow();
	expect(() =>
		videoInformation({
			...PROBE,
			streams: [{ ...PROBE.streams[0], width: 8192 }],
		}),
	).toThrow();
});
it("parses fractional frame rates conservatively", () => {
	expect(frameRate("30000/1001")).toBeLessThan(30);
	expect(frameRate("0/0")).toBeNaN();
});
