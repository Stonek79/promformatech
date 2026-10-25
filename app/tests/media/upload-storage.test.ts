import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
	mkdtemp,
	readFile,
	rm,
	stat,
	symlink,
	truncate,
	utimes,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { MEDIA_POLICY, MEDIA_SOURCE, MEDIA_UPLOAD } from "@/config/media";
import { MEDIA_STORAGE } from "@/config/media-storage";

const SOURCE = Buffer.from("unchanged source bytes");
let root: string;
let storage: typeof import("@/features/media/storage");
let upload: typeof import("@/features/media/upload-source");

beforeAll(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), "pf-upload-test-"));
	vi.stubEnv("MEDIA_ROOT", root);
	storage = await import("@/features/media/storage");
	upload = await import("@/features/media/upload-source");
	await storage.ensureMediaStorage();
});
afterAll(async () => {
	vi.unstubAllEnvs();
	await rm(root, { recursive: true, force: true });
});

it("copies the server temp file without changing parser-owned bytes", async () => {
	const file = path.join(upload.uploadDirectory(), "parser-owned-upload");
	await writeFile(file, SOURCE);
	const key = await storage.saveOriginal({
		kind: MEDIA_SOURCE.temporary,
		path: file,
	});
	expect(await readFile(storage.storagePaths(key).original)).toEqual(SOURCE);
	expect(await readFile(file)).toEqual(SOURCE);
	expect((await stat(storage.storagePaths(key).original)).mode & 0o777).toBe(
		MEDIA_STORAGE.fileMode,
	);
	await storage.confirmOriginal(key);
});

it("removes stale interrupted processing directories without touching a fresh job", async () => {
	const stale = await storage.processingDirectory(randomUUID());
	const fresh = await storage.processingDirectory(randomUUID());
	const expired = new Date(
		Date.now() - MEDIA_UPLOAD.orphanGraceMilliseconds - 1000,
	);
	await utimes(stale, expired, expired);
	const { cleanupStaleProcessing } = await import(
		"@/features/media/cleanup-staging"
	);
	await cleanupStaleProcessing();
	await expect(stat(stale)).rejects.toThrow();
	expect((await stat(fresh)).isDirectory()).toBe(true);
});

it("preserves Local API buffer uploads", async () => {
	const key = await storage.saveOriginal(SOURCE);
	expect(await readFile(storage.storagePaths(key).original)).toEqual(SOURCE);
});

it("rejects paths outside the private parser directory and symlinks", async () => {
	const outside = path.join(root, "outside");
	await writeFile(outside, SOURCE);
	await expect(
		storage.saveOriginal({ kind: MEDIA_SOURCE.temporary, path: outside }),
	).rejects.toThrow();
	const link = path.join(upload.uploadDirectory(), "linked-upload");
	await symlink(outside, link);
	await expect(
		storage.saveOriginal({ kind: MEDIA_SOURCE.temporary, path: link }),
	).rejects.toThrow();
});

it("rejects an oversized file before copying any bytes", async () => {
	const file = path.join(upload.uploadDirectory(), "oversized");
	await writeFile(file, "");
	await truncate(file, MEDIA_POLICY.maxFileBytes + 1);
	await expect(
		storage.saveOriginal({ kind: MEDIA_SOURCE.temporary, path: file }),
	).rejects.toThrow();
});

it("copies a large sparse upload with a matching streaming checksum", async () => {
	const file = path.join(upload.uploadDirectory(), "large");
	await writeFile(file, SOURCE);
	await truncate(file, 64 * 1024 * 1024);
	const key = await storage.saveOriginal({
		kind: MEDIA_SOURCE.temporary,
		path: file,
	});
	async function checksum(location: string) {
		const hash = createHash("sha256");
		for await (const chunk of createReadStream(location)) {
			hash.update(chunk);
		}
		return hash.digest("hex");
	}
	expect(await checksum(storage.storagePaths(key).original)).toBe(
		await checksum(file),
	);
});
