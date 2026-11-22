import { spawn } from "node:child_process";
import { once } from "node:events";
import { PROCESS_ROLE, RUNTIME } from "../src/config/runtime.ts";

const DEFAULT_HOST = "127.0.0.1";
const BOOTSTRAP_SCRIPT = "src/cms/scripts/bootstrap-dev.ts";
const WORKER_SCRIPT = "src/cms/scripts/worker.ts";
const WATCH_PARENT = new URL("./lib/watch-dev-parent.mjs", import.meta.url);
const environment = {
	...process.env,
	NODE_ENV: "development",
};
const children = new Set();
let stopping = false;

function stop() {
	if (stopping) {
		return;
	}
	stopping = true;
	for (const child of children) {
		if (child.exitCode === null && child.signalCode === null) {
			child.kill("SIGTERM");
		}
	}
}

function launch(
	command,
	args,
	{ bootstrap = false, detached = false, role = PROCESS_ROLE.web, env } = {},
) {
	const stdio = [detached ? "ignore" : "inherit", "inherit", "inherit"];
	const watchParent = bootstrap || detached;
	const childEnv = { ...environment, ...env, APP_PROCESS_ROLE: role };
	if (watchParent) {
		childEnv.NODE_OPTIONS = [
			childEnv.NODE_OPTIONS,
			`--import=${WATCH_PARENT.href}`,
		]
			.filter(Boolean)
			.join(" ");
	}
	const child = spawn(command, args, {
		env: childEnv,
		detached,
		stdio: watchParent ? [...stdio, "ipc"] : stdio,
	});
	children.add(child);
	let initialized = false;
	if (bootstrap) {
		child.once("message", (message) => {
			initialized = message === true;
		});
	}
	return once(child, "exit")
		.then(([code, signal]) => ({
			command,
			code,
			signal,
			initialized,
		}))
		.finally(() => children.delete(child));
}

async function prepare(command, args, options) {
	const result = await launch(command, args, options);
	if (stopping) {
		return;
	}
	if (result.code !== 0) {
		throw new Error(
			`Команда ${[command, ...args].join(" ")} завершилась: ${result.signal ?? result.code}`,
		);
	}
	// Payload can exit with code 0 when a schema change is declined.
	if (options?.bootstrap && !result.initialized) {
		throw new Error("Подготовка локальной базы не завершена.");
	}
}

async function run() {
	await prepare("pnpm", ["env:init"]);
	if (stopping) {
		return;
	}
	await prepare("pnpm", ["prepare:app"]);
	if (stopping) {
		return;
	}
	await prepare("payload", ["run", BOOTSTRAP_SCRIPT], { bootstrap: true });
	if (stopping) {
		return;
	}

	const services = [
		launch(
			"next",
			[
				"dev",
				"--turbopack",
				"--hostname",
				DEFAULT_HOST,
				...process.argv.slice(2),
			],
			{
				detached: true,
				env: { SQLITE_SCHEMA_PUSH: RUNTIME.disabledSchemaPush },
			},
		),
		launch("payload", ["run", WORKER_SCRIPT], {
			detached: true,
			role: PROCESS_ROLE.worker,
		}),
	];
	try {
		const result = await Promise.race(services);
		if (!stopping) {
			throw new Error(
				`Процесс ${result.command} завершился: ${result.signal ?? result.code}`,
			);
		}
	} finally {
		stop();
		await Promise.allSettled(services);
	}
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
process.on("SIGHUP", stop);
try {
	await run();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
} finally {
	process.off("SIGINT", stop);
	process.off("SIGTERM", stop);
	process.off("SIGHUP", stop);
}
