import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "pg";
import { verifyHTTPUpload } from "./http-upload.mjs";

const BASE_URL = "http://127.0.0.1:3201";
const ORIGINS = [
	"https://first-runtime.example.test",
	"https://second-runtime.example.test",
];

async function withServer(environment, verify) {
	const child = spawn(
		"pnpm",
		["exec", "next", "start", "--hostname", "127.0.0.1", "--port", "3201"],
		{
			env: { ...environment, NEXT_OUTPUT_DIR: ".next-verification" },
			detached: true,
			stdio: ["ignore", "pipe", "pipe"],
		},
	);
	let output = "";
	child.stdout.on("data", (chunk) => {
		output = (output + chunk.toString()).slice(-8192);
	});
	child.stderr.on("data", (chunk) => {
		output = (output + chunk.toString()).slice(-8192);
	});
	try {
		let ready = false;
		for (let attempt = 0; attempt < 60; attempt++) {
			try {
				if ((await fetch(`${BASE_URL}/api/health/live`)).ok) {
					ready = true;
					break;
				}
			} catch {
				/* The owned server is still starting. */
			}
			if (child.exitCode !== null) {
				throw new Error(`Owned production server exited: ${output}`);
			}
			await delay(500);
		}
		assert(ready, "Production server did not start");
		await verify();
	} finally {
		try {
			process.kill(-child.pid, "SIGTERM");
		} catch {
			/* Already stopped. */
		}
		for (let attempt = 0; attempt < 20 && child.exitCode === null; attempt++) {
			await delay(250);
		}
		if (child.exitCode === null) {
			try {
				process.kill(-child.pid, "SIGKILL");
			} catch {}
		}
	}
}

export async function verifyProduction(environment, directory) {
	const database = new Client({ connectionString: environment.DATABASE_URL });
	await database.connect();
	try {
		for (const origin of ORIGINS) {
			const headers = { Host: new URL(origin).host, Origin: origin };
			await withServer({ ...environment, SERVER_URL: origin }, async () => {
				assert.equal(
					(await fetch(`${BASE_URL}/api/health/ready`, { headers })).status,
					200,
				);
				const robots = await (
					await fetch(`${BASE_URL}/robots.txt`, { headers })
				).text();
				const sitemap = await (
					await fetch(`${BASE_URL}/sitemap.xml`, { headers })
				).text();
				assert(robots.includes(`${origin}/sitemap.xml`));
				assert(sitemap.includes(`${origin}/`));
				assert(!sitemap.includes("build.invalid"));
				assert(!sitemap.includes(ORIGINS.find((entry) => entry !== origin)));
				const page = await (await fetch(BASE_URL, { headers })).text();
				assert(
					page.includes(origin),
					"Canonical metadata must use the runtime origin",
				);
				if (origin === ORIGINS[0]) {
					await verifyHTTPUpload(
						BASE_URL,
						headers,
						environment,
						database,
						directory,
					);
				}
			});
		}
		await withServer(
			{
				...environment,
				DATABASE_URL:
					"postgresql://unavailable:unavailable@127.0.0.1:1/unavailable",
				SERVER_URL: ORIGINS[0],
			},
			async () => {
				assert.equal((await fetch(`${BASE_URL}/api/health/live`)).status, 200);
				const response = await fetch(`${BASE_URL}/api/health/ready`);
				assert.equal(response.status, 503);
				assert.deepEqual(await response.json(), { status: "unavailable" });
			},
		);
		console.log(
			"Production: one build / two runtime domains; liveness and database readiness failure verified",
		);
	} finally {
		await database.end();
	}
}
