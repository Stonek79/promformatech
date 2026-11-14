import { execFileSync, spawnSync } from "node:child_process";
import { closeSync, mkdirSync, mkdtempSync, openSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const APP = "app/";
const CONFIG = `${APP}biome.json`;

function gitRecords(args) {
	return execFileSync("git", args, { encoding: "utf8" })
		.split("\0")
		.filter(Boolean);
}

function indexedFiles() {
	const entries = gitRecords(["ls-files", "--stage", "-z", "--", APP]);
	const files = new Map();
	for (const entry of entries) {
		const match = /^100(?:644|755) ([\da-f]+) 0\t([\s\S]+)$/.exec(entry);
		if (match) {
			files.set(match[2], match[1]);
		}
	}
	return files;
}

function writeBlob(object, destination) {
	mkdirSync(dirname(destination), { recursive: true });
	const file = openSync(destination, "wx");
	try {
		execFileSync("git", ["cat-file", "blob", object], {
			stdio: ["ignore", file, "inherit"],
		});
	} finally {
		closeSync(file);
	}
}

function checkStaged() {
	const changed = gitRecords([
		"diff",
		"--cached",
		"--name-only",
		"--no-renames",
		"--diff-filter=AMT",
		"-z",
		"--",
		APP,
	]);
	if (changed.length === 0) {
		return 0;
	}
	const index = indexedFiles();
	const files = changed.filter((file) => index.has(file));
	if (files.length === 0) {
		return 0;
	}
	if (!index.has(CONFIG)) {
		throw new Error("В индексе Git отсутствует app/biome.json.");
	}
	const snapshot = mkdtempSync(join(tmpdir(), "pft-pre-commit-"));
	try {
		const supportingFiles = [...index.keys()].filter((file) =>
			file.endsWith("/.gitignore"),
		);
		for (const file of new Set([CONFIG, ...supportingFiles, ...files])) {
			writeBlob(index.get(file), join(snapshot, file.slice(APP.length)));
		}
		const result = spawnSync(
			resolve(APP, "node_modules/.bin/biome"),
			[
				"check",
				"--no-errors-on-unmatched",
				"--",
				...files.map((file) => `./${file.slice(APP.length)}`),
			],
			{ cwd: snapshot, stdio: "inherit" },
		);
		if (result.error?.code === "ENOENT") {
			throw new Error("Установите зависимости в app командой pnpm install.");
		}
		if (result.error) {
			throw result.error;
		}
		return result.status ?? 1;
	} finally {
		rmSync(snapshot, { recursive: true, force: true });
	}
}

try {
	process.exitCode = checkStaged();
} catch (error) {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
}
