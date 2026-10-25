import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCMS } from "@/cms/client";
import { COLLECTIONS } from "@/config/content";
import { processCommand } from "@/features/media/process-command";

if (
	!new URL(process.env.DATABASE_URL || "").pathname.startsWith(
		"/promformatech_verification_target_",
	)
) {
	throw new Error("Queue fixture requires an isolated target database");
}
const filename = path.join(
	process.env.TEST_DIRECTORY || "",
	"shutdown-video.mp4",
);
await processCommand(
	process.env.FFMPEG_PATH || "ffmpeg",
	[
		"-nostdin",
		"-v",
		"error",
		"-f",
		"lavfi",
		"-i",
		"color=size=320x240:rate=10",
		"-t",
		"1",
		"-c:v",
		"libx264",
		"-pix_fmt",
		"yuv420p",
		"-threads",
		"1",
		filename,
	],
	30_000,
);
const bytes = await readFile(filename);
const cms = await getCMS();
try {
	const media = await cms.create({
		collection: COLLECTIONS.media,
		data: { title: "Shutdown recovery video" },
		file: {
			data: bytes,
			name: "video.mp4",
			mimetype: "video/mp4",
			size: bytes.length,
		},
		overrideAccess: true,
	});
	await writeFile(
		path.join(process.env.TEST_DIRECTORY || "", "shutdown-fixture.json"),
		JSON.stringify({ id: media.id, storageKey: media.storageKey }),
		{ mode: 0o600 },
	);
} finally {
	await cms.destroy();
}
