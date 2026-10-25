import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, mkdtemp } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { Client } from "pg";
import { verifyProduction } from "./production-smoke.mjs";
import { verifyWorkerLifecycle } from "./worker-lifecycle.mjs";

process.loadEnvFile(".env");
const nonce = randomBytes(5).toString("hex");
const sourceName = `promformatech_verification_source_${nonce}`;
const targetName = `promformatech_verification_target_${nonce}`;
const bootstrapName = `promformatech_verification_bootstrap_${nonce}`;
const parent = path.resolve("private/verification");
await mkdir(parent, { recursive: true });
const directory = await mkdtemp(path.join(parent, "deployment-"));
const base = new URL(process.env.DATABASE_URL);
base.pathname = "/postgres";
const admin = new Client({ connectionString: base.toString() });
await admin.connect();
const owned = [];
const sourceURL = new URL(base),
	targetURL = new URL(base);
sourceURL.pathname = `/${sourceName}`;
targetURL.pathname = `/${targetName}`;
const common = {
	...process.env,
	NEXT_PHASE: "",
	SMTP_HOST: "",
	SMTP_FROM: "",
	PAYLOAD_SECRET: randomBytes(32).toString("hex"),
	TEST_PASSWORD: randomBytes(24).toString("hex"),
	TEST_FIXTURE_FILE: path.join(directory, "fixture.json"),
	APP_PROCESS_ROLE: "web",
};
function run(args, environment) {
	const result = spawnSync("pnpm", args, {
		env: environment,
		stdio: "inherit",
	});
	if (result.status !== 0) {
		throw new Error(`Isolated verification command failed: ${args[0]}`);
	}
}
function expectFailure(args, environment, expectedMessage) {
	const result = spawnSync("pnpm", args, {
		env: environment,
		stdio: "pipe",
		encoding: "utf8",
	});
	if (result.status === 0) {
		throw new Error(`Unsafe operation was not rejected: ${args[0]}`);
	}
	if (
		expectedMessage &&
		!`${result.stdout}${result.stderr}`.includes(expectedMessage)
	) {
		throw new Error(
			`Unexpected failure reason for ${args[0]}; expected ${expectedMessage}`,
		);
	}
	console.log(`Expected rejection verified: ${args[0]}`);
}
try {
	for (const name of [sourceName, targetName, bootstrapName]) {
		await admin.query(`CREATE DATABASE "${name}"`);
		owned.push(name);
	}
	const source = {
		...common,
		NODE_ENV: "development",
		DATABASE_URL: sourceURL.toString(),
		MEDIA_ROOT: path.join(directory, "source-media"),
		SERVER_URL: "http://127.0.0.1:3201",
	};
	const target = {
		...common,
		NODE_ENV: "production",
		DATABASE_URL: targetURL.toString(),
		MEDIA_ROOT: path.join(directory, "target-media"),
		SERVER_URL: "https://runtime.example.test",
	};
	run(["exec", "payload", "run", "tests/integration/setup.ts"], source);
	run(["db:migrate"], target);
	run(["db:migrate"], target);
	const bootstrapURL = new URL(targetURL);
	bootstrapURL.pathname = `/${bootstrapName}`;
	const bootstrap = {
		...target,
		DATABASE_URL: bootstrapURL.toString(),
		MEDIA_ROOT: path.join(directory, "bootstrap-media"),
		OWNER_EMAIL: "bootstrap@example.test",
		OWNER_PASSWORD: common.TEST_PASSWORD,
	};
	run(["db:migrate"], bootstrap);
	run(["cms:create-owner"], bootstrap);
	expectFailure(["cms:create-owner"], bootstrap, "Владелец уже существует");
	expectFailure(
		["db:migrate"],
		{ ...source, SERVER_URL: target.SERVER_URL },
		"Dev migration markers are forbidden",
	);
	const transfer = {
		...target,
		SOURCE_DATABASE_URL: source.DATABASE_URL,
		SOURCE_MEDIA_ROOT: source.MEDIA_ROOT,
		IMPORT_REPORT_DIR: path.join(directory, "report"),
	};
	run(["cms:import-content"], transfer);
	expectFailure(
		["cms:import-content"],
		{ ...transfer, SOURCE_DATABASE_URL: target.DATABASE_URL },
		"Source and target database must be different",
	);
	const sourceValidation = new Client({
		connectionString: source.DATABASE_URL,
	});
	await sourceValidation.connect();
	try {
		await sourceValidation.query(
			"UPDATE payload_jobs SET queue='unsupported' WHERE task_slug='process-media'",
		);
		expectFailure(
			["cms:import-content"],
			transfer,
			"Snapshot contains an unsupported task or queue",
		);
		await sourceValidation.query(
			"UPDATE payload_jobs SET queue='media' WHERE task_slug='process-media'",
		);
	} finally {
		await sourceValidation.end();
	}
	run(["cms:import-content", "--apply"], {
		...transfer,
		IMPORT_CONFIRM: "IMPORT_INTO_EMPTY_MIGRATED_DATABASE",
	});
	run(["worker:once"], { ...target, APP_PROCESS_ROLE: "worker" });
	await delay(3100);
	run(["worker:once"], { ...target, APP_PROCESS_ROLE: "worker" });
	run(
		["exec", "payload", "run", "tests/integration/assert-content.ts"],
		target,
	);
	expectFailure(["cms:import-content", "--apply"], {
		...transfer,
		IMPORT_CONFIRM: "IMPORT_INTO_EMPTY_MIGRATED_DATABASE",
	});
	const validation = new Client({ connectionString: target.DATABASE_URL });
	await validation.connect();
	try {
		await validation.query(
			"ALTER TABLE users ADD COLUMN verification_only integer",
		);
		expectFailure(["cms:import-content"], transfer);
		await validation.query("ALTER TABLE users DROP COLUMN verification_only");
	} finally {
		await validation.end();
	}
	if (process.env.RUN_PRODUCTION_SMOKE === "true") {
		await verifyWorkerLifecycle(
			{ ...target, APP_PROCESS_ROLE: "worker" },
			directory,
			run,
		);
		await verifyProduction(target, directory);
	}
	console.log(
		`Isolated rehearsal prepared: ${path.relative(process.cwd(), directory)}`,
	);
} finally {
	for (const name of owned.reverse()) {
		await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
	}
	await admin.end();
}
