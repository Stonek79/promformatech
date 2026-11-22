import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const output = path.resolve("artifacts/release");
const directory = await mkdtemp(path.join(os.tmpdir(), "pft-release-"));
const release = path.join(directory, "release");
const localizedCatalogs = [
	{ locale: "en", heading: "Products" },
	{ locale: "de", heading: "Produkte" },
];
// Moving outside the checkout catches accidental fallback to source node_modules.
await cp(output, release, { recursive: true, verbatimSymlinks: true });
const env = {
	...process.env,
	NODE_ENV: "production",
	NODE_PATH: "",
	NEXT_PHASE: "",
	SMTP_HOST: "",
	SMTP_FROM: "",
	SERVER_URL: "https://runtime.example.test",
	DATABASE_URL: `file:${directory}/verification.sqlite`,
	MEDIA_ROOT: path.join(directory, "media"),
	PAYLOAD_SECRET: randomBytes(32).toString("hex"),
	OWNER_EMAIL: "release@example.test",
	OWNER_PASSWORD: randomBytes(24).toString("hex"),
	HOSTNAME: "127.0.0.1",
	PORT: "3201",
};
function cli(name, role = "web", args = []) {
	const result = spawnSync(process.execPath, [`ops/${name}.mjs`, ...args], {
		cwd: release,
		env: { ...env, APP_PROCESS_ROLE: role },
		stdio: "inherit",
	});
	assert.equal(result.status, 0, `Packaged CLI failed: ${name}`);
}

async function verifyLocalizedCatalog({ locale, heading }, headers) {
	const response = await fetch(`http://127.0.0.1:3201/${locale}/products`, {
		headers,
	});
	assert.equal(response.status, 200);
	const html = await response.text();
	assert(html.includes(`<html lang="${locale}"`));
	assert(html.includes(`>${heading}</h1>`));
	assert(html.includes("Шариковая направляющая колонна A-TRP"));
}

async function verifyMediaWorker(headers) {
	const form = new FormData();
	form.set(
		"_payload",
		JSON.stringify({ title: "Проверка релиза", alt: "Тест обработки фото" }),
	);
	const bytes = await readFile(path.join(release, "seed-assets/about.jpg"));
	form.set(
		"file",
		new Blob([bytes], { type: "image/jpeg" }),
		"release-check.jpg",
	);
	const upload = await fetch("http://127.0.0.1:3201/api/media?draft=true", {
		method: "POST",
		headers,
		body: form,
	});
	assert.equal(upload.status, 201, "Packaged upload failed");
	const { doc } = await upload.json();
	assert.equal(doc.processingStatus, "queued");
	cli("worker", "worker", ["once"]);
	const media = await fetch(
		`http://127.0.0.1:3201/api/media/${doc.id}?draft=true`,
		{ headers },
	);
	assert.equal(media.status, 200);
	assert.equal((await media.json()).processingStatus, "ready");
}

async function verifyWeb(origin, databaseAvailable = true) {
	const child = spawn(process.execPath, ["server.js"], {
		cwd: release,
		env: {
			...env,
			SERVER_URL: origin,
			DATABASE_URL: databaseAvailable
				? env.DATABASE_URL
				: `file:${directory}/missing.sqlite`,
		},
		stdio: ["ignore", "pipe", "pipe"],
	});
	let output = "";
	for (const stream of [child.stdout, child.stderr]) {
		stream.on("data", (chunk) => {
			output = (output + chunk).slice(-8192);
		});
	}
	try {
		let ready = false;
		for (let attempt = 0; attempt < 60; attempt++) {
			if (child.exitCode !== null) {
				throw new Error(`Packaged server exited: ${output}`);
			}
			try {
				ready = (await fetch("http://127.0.0.1:3201/api/health/live")).ok;
				if (ready) {
					break;
				}
			} catch {
				/* Wait only for this child. */
			}
			await delay(500);
		}
		assert(ready, `Packaged readiness failed: ${output}`);
		const health = await fetch("http://127.0.0.1:3201/api/health/ready");
		assert.equal(health.status, databaseAvailable ? 200 : 503);
		if (!databaseAvailable) {
			assert.deepEqual(await health.json(), { status: "unavailable" });
			return;
		}
		const headers = { Host: new URL(origin).host, Origin: origin };
		assert.equal(
			(await fetch("http://127.0.0.1:3201/admin/login", { headers })).status,
			200,
		);
		const response = await fetch("http://127.0.0.1:3201/", { headers });
		assert.equal(response.status, 200);
		const html = await response.text();
		assert(html.includes("Прямые поставки из Китая"));
		assert(html.includes(origin), "Canonical origin must be read at runtime");
		assert(!html.includes("build.invalid"));
		const stylesheet = html.match(/href="([^"]+\.css[^"]*)"/);
		assert(stylesheet, "Missing CSS link");
		assert.equal(
			(await fetch(new URL(stylesheet[1], "http://127.0.0.1:3201"))).status,
			200,
		);
		const login = await fetch("http://127.0.0.1:3201/api/users/login", {
			method: "POST",
			headers: { ...headers, "Content-Type": "application/json" },
			body: JSON.stringify({
				email: env.OWNER_EMAIL,
				password: env.OWNER_PASSWORD,
			}),
		});
		assert.equal(login.status, 200);
		if (origin === env.SERVER_URL) {
			const cookie = login.headers.get("set-cookie")?.split(";")[0];
			assert(cookie, "Packaged login did not set a session cookie");
			await verifyMediaWorker({ ...headers, Cookie: cookie });
		}
		await Promise.all(
			localizedCatalogs.map((catalog) =>
				verifyLocalizedCatalog(catalog, headers),
			),
		);
	} finally {
		child.kill("SIGTERM");
		for (let i = 0; i < 40 && child.exitCode === null; i++) {
			await delay(250);
		}
		if (child.exitCode === null) {
			child.kill("SIGKILL");
			await new Promise((resolve) => child.once("exit", resolve));
		}
	}
}
try {
	cli("migrate", "migrator");
	cli("migrate", "migrator");
	cli("create-owner");
	cli("seed");
	await verifyWeb(env.SERVER_URL);
	await verifyWeb("https://second-runtime.example.test");
	await verifyWeb(env.SERVER_URL, false);
	console.log(
		"Relocated release: CLI, native SQLite/Sharp, media worker, localized pages, assets, login and two runtime origins passed.",
	);
} finally {
	await rm(directory, { recursive: true, force: true });
}
