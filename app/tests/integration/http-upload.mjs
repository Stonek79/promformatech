import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat, truncate, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { MEDIA_STORAGE } from "../../src/config/media-storage.ts";

export async function verifyHTTPUpload(
	baseURL,
	headers,
	environment,
	database,
	directory,
) {
	const login = await fetch(`${baseURL}/api/users/login`, {
		method: "POST",
		headers: { ...headers, "Content-Type": "application/json" },
		body: JSON.stringify({
			email: "owner@example.test",
			password: environment.TEST_PASSWORD,
		}),
	});
	assert.equal(login.status, 200);
	const cookie = login.headers
		.getSetCookie()
		.map((entry) => entry.split(";")[0])
		.join("; ");
	assert(cookie);
	const authenticated = { ...headers, Cookie: cookie };
	const original = await readFile("seed-assets/about.jpg");
	const large = path.join(directory, "large-http-upload.jpg");
	await writeFile(large, original);
	await truncate(large, 64 * 1024 * 1024);
	async function upload(title, filename, extraFiles = 0) {
		const boundary = `pf-${randomUUID()}`;
		async function* body() {
			yield Buffer.from(
				`--${boundary}\r\nContent-Disposition: form-data; name="_payload"\r\n\r\n${JSON.stringify({ title, alt: title })}\r\n`,
			);
			for (let index = 0; index <= extraFiles; index++) {
				yield Buffer.from(
					`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="fixture.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`,
				);
				yield* createReadStream(filename);
				yield Buffer.from("\r\n");
			}
			yield Buffer.from(`--${boundary}--\r\n`);
		}
		return fetch(`${baseURL}/api/media?draft=true`, {
			method: "POST",
			headers: {
				...authenticated,
				"Content-Type": `multipart/form-data; boundary=${boundary}`,
			},
			body: Readable.from(body()),
			duplex: "half",
		});
	}
	const response = await upload("Large HTTP fixture", large);
	assert.equal(
		response.status,
		201,
		"A valid upload above the former 50 MiB request limit must be accepted",
	);
	const { doc } = await response.json();
	assert.equal(doc.filesize, (await stat(large)).size);
	const stored = path.join(
		environment.MEDIA_ROOT,
		MEDIA_STORAGE.originals,
		doc.storageKey,
		"original",
	);
	assert.equal((await stat(stored)).size, (await stat(large)).size);
	assert.equal(
		(await fetch(`${baseURL}/media/${doc.id}/original`, { headers })).status,
		404,
	);
	assert.equal((await upload("Extra file must fail", large, 1)).status, 413);
	const before = (
		await readdir(path.join(environment.MEDIA_ROOT, MEDIA_STORAGE.originals))
	).length;
	await database.query(
		"ALTER TABLE media ADD CONSTRAINT verification_reject CHECK (title <> 'reject-after-save')",
	);
	try {
		const rejected = await upload("reject-after-save", "seed-assets/about.jpg");
		assert.equal(rejected.status, 500);
		const after = (
			await readdir(path.join(environment.MEDIA_ROOT, MEDIA_STORAGE.originals))
		).length;
		assert.equal(
			after,
			before,
			"A failed database write must not leave an unreferenced original",
		);
	} finally {
		await database.query(
			"ALTER TABLE media DROP CONSTRAINT verification_reject",
		);
	}
	assert.deepEqual(
		await readdir(path.join(environment.MEDIA_ROOT, MEDIA_STORAGE.uploads)),
		[],
	);
	console.log(
		"HTTP: 64 MiB upload, private originals, multipart limit and database-error cleanup verified",
	);
}
