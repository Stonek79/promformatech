import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MAX_LINES = 300;
const CODE_DIRECTORIES = ["src", "scripts", "tests"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js", ".css"]);
const violations = [];

async function checkDirectory(directory) {
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const filename = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			await checkDirectory(filename);
		} else if (
			entry.isFile() &&
			CODE_EXTENSIONS.has(path.extname(entry.name))
		) {
			const contents = await readFile(filename, "utf8");
			const lines = contents.trimEnd().split("\n").length;
			if (lines > MAX_LINES) {
				violations.push(`${filename}: ${lines} lines (maximum ${MAX_LINES})`);
			}
		}
	}
}

for (const directory of CODE_DIRECTORIES) {
	await checkDirectory(directory);
}
if (violations.length > 0) {
	throw new Error(violations.join("\n"));
}
console.log(`Code structure: all files within ${MAX_LINES} lines`);
