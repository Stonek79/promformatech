export const VIDEO_CODEC = {
	video: "h264",
	audio: "aac",
	pixelFormat: "yuv420p",
} as const;
export const VIDEO_STREAM = { video: "video", audio: "audio" } as const;
export const VIDEO_STRATEGY = { remux: "remux", encode: "encode" } as const;
export const VIDEO_POLICY = {
	maximumSourceEdge: 4096,
	maximumSourceShortEdge: 2160,
	maximumFrameRate: 30,
	maximumVideoBitrate: 8_000_000,
	maximumAudioBitrate: 192_000,
	maximumContainerBitrate: 8_500_000,
	maximumAudioChannels: 2,
	maximumLevel: 42,
	profiles: ["Constrained Baseline", "Baseline", "Main", "High"],
	squarePixels: "1:1",
	bitsPerByte: 8,
	divisibleBy: 2,
	audioBitrate: "128k",
	encoderBuffer: "16M",
	preset: "medium",
	ffmpeg: "ffmpeg",
	ffprobe: "ffprobe",
	inputFlags: [
		"-protocol_whitelist",
		"file,pipe",
		"-format_whitelist",
		"mov,matroska,webm",
	],
	probeEntries:
		"format=duration,bit_rate:stream=codec_type,codec_name,pix_fmt,width,height,avg_frame_rate,bit_rate,profile,level,sample_aspect_ratio,channels:stream_tags=rotate:stream_side_data=rotation",
} as const;
