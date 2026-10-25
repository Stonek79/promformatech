import { stat } from "node:fs/promises";
import path from "node:path";
import { MEDIA_KIND, MEDIA_VARIANTS } from "@/config/media-assets";
import { videoInformation, videoStrategy } from "./video-policy";
import { probeVideo } from "./video-probe";
import { createVideoPoster, transcodeVideo } from "./video-transcode";

export async function processVideo(original: string, directory: string) {
	const probe = await probeVideo(original);
	const information = videoInformation(probe);
	const strategy = videoStrategy(probe, (await stat(original)).size);
	const output = path.join(directory, MEDIA_VARIANTS.video.file);
	await transcodeVideo(original, output, probe, strategy);
	await createVideoPoster(output, directory);
	const result = videoInformation(await probeVideo(output));
	return {
		kind: MEDIA_KIND.video,
		width: result.width,
		height: result.height,
		duration: information.duration,
		optimizedBytes: (await stat(output)).size,
	};
}
