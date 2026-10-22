import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { HTTP } from "@/config/forms";
import { parseByteRange } from "./range";

export async function serveFile(
	request: Request,
	file: string,
	mime: string,
	filename?: string,
) {
	const { size } = await stat(file);
	const headers = new Headers({
		"Content-Type": mime,
		"Accept-Ranges": "bytes",
		"Cache-Control": "private, no-store",
		"X-Content-Type-Options": "nosniff",
	});
	if (filename) {
		headers.set(
			"Content-Disposition",
			`attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
		);
	}
	let range: ReturnType<typeof parseByteRange>;
	try {
		range = parseByteRange(request.headers.get("range"), size);
	} catch {
		headers.set("Content-Range", `bytes */${size}`);
		return new Response(null, { status: HTTP.rangeNotSatisfiable, headers });
	}
	headers.set(
		"Content-Length",
		String(range ? range.end - range.start + 1 : size),
	);
	if (range) {
		headers.set("Content-Range", `bytes ${range.start}-${range.end}/${size}`);
	}
	const body =
		request.method === "HEAD"
			? null
			: (Readable.toWeb(
					createReadStream(file, range),
				) as ReadableStream<Uint8Array>);
	return new Response(body, {
		status: range ? HTTP.partialContent : HTTP.ok,
		headers,
	});
}
