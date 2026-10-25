import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "pg";

export async function verifyWorkerLifecycle(environment, directory, run) {
	run(["exec", "payload", "run", "tests/integration/queue-video.ts"], {
		...environment,
		TEST_DIRECTORY: directory,
	});
	const fixture = JSON.parse(
		await readFile(path.join(directory, "shutdown-fixture.json"), "utf8"),
	);
	const started = path.join(directory, "slow-processor-started");
	const processor = path.join(directory, "slow-ffmpeg.mjs");
	await writeFile(
		processor,
		`#!/usr/bin/env node\nimport {writeFileSync} from "node:fs";\nwriteFileSync(process.env.TEST_PROCESS_STARTED, String(process.pid));\nsetTimeout(() => process.exit(1), 120000);\n`,
		{ mode: 0o700 },
	);
	const child = spawn("pnpm", ["worker"], {
		env: {
			...environment,
			FFMPEG_PATH: processor,
			TEST_PROCESS_STARTED: started,
		},
		stdio: "ignore",
		detached: true,
	});
	const database = new Client({ connectionString: environment.DATABASE_URL });
	await database.connect();
	try {
		let active = false;
		for (let attempt = 0; attempt < 80; attempt++) {
			try {
				await stat(started);
				active = true;
				break;
			} catch {}
			if (child.exitCode !== null) {
				throw new Error("Owned worker stopped before the shutdown fixture");
			}
			await delay(250);
		}
		assert(active);
		const competing = spawnSync("pnpm", ["worker:once"], {
			env: environment,
			encoding: "utf8",
			stdio: "pipe",
		});
		assert.notEqual(
			competing.status,
			0,
			"A second worker must not acquire ownership",
		);
		const heartbeat = JSON.parse(
			await readFile(
				path.join(environment.MEDIA_ROOT, "worker-heartbeat.json"),
				"utf8",
			),
		);
		const before = Date.now();
		process.kill(heartbeat.pid, "SIGTERM");
		for (let attempt = 0; attempt < 180 && child.exitCode === null; attempt++) {
			await delay(250);
		}
		assert.notEqual(
			child.exitCode,
			null,
			"Worker must finish within the shutdown deadline",
		);
		assert(
			Date.now() - before >= 29_000,
			"The active job must receive its graceful completion window",
		);
		const row = (
			await database.query(
				"SELECT version_processing_status AS processing_status, version_storage_key AS storage_key FROM _media_v WHERE parent_id=$1 AND latest=true",
				[fixture.id],
			)
		).rows[0];
		assert.equal(row.processing_status, "queued");
		assert.equal(row.storage_key, fixture.storageKey);
		await stat(
			path.join(
				environment.MEDIA_ROOT,
				"originals",
				fixture.storageKey,
				"original",
			),
		);
		await delay(3100);
		run(["worker:once"], environment);
		assert.equal(
			(
				await database.query(
					"SELECT version_processing_status AS processing_status FROM _media_v WHERE parent_id=$1 AND latest=true",
					[fixture.id],
				)
			).rows[0].processing_status,
			"ready",
		);
		console.log(
			"Worker: exclusive ownership, SIGTERM grace, interrupted retry and preserved original verified",
		);
	} finally {
		try {
			process.kill(-child.pid, "SIGKILL");
		} catch {
			/* Owned process group already exited. */
		}
		await database.end();
	}
}
