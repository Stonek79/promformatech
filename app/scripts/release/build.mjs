import { execFileSync } from "node:child_process";
import {
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const output = path.resolve("artifacts/release");
const nextDirectory = process.env.NEXT_OUTPUT_DIR || ".next";
const entries = ["worker", "migrate", "seed", "create-owner"];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(nextDirectory, "standalone"), output, {
	recursive: true,
	verbatimSymlinks: true,
});
// Next standalone may copy local .env files. They never belong in a release.
for (const entry of await readdir(output)) {
	if (entry.startsWith(".env")) {
		await rm(path.join(output, entry), { force: true });
	}
}
await cp(
	path.join(nextDirectory, "static"),
	path.join(output, nextDirectory, "static"),
	{ recursive: true, verbatimSymlinks: true },
);
await cp("public", path.join(output, "public"), {
	recursive: true,
	verbatimSymlinks: true,
});
await cp("seed-assets", path.join(output, "seed-assets"), {
	recursive: true,
	verbatimSymlinks: true,
});
// The CLI has dependencies that web tracing cannot discover. Install them in CI,
// never on the target host, and share one production dependency tree with web.
const dependencies = await mkdtemp(path.join(os.tmpdir(), "pft-dependencies-"));
try {
	for (const file of ["package.json", "pnpm-lock.yaml"]) {
		await cp(file, path.join(dependencies, file));
	}
	execFileSync(
		"pnpm",
		["install", "--prod", "--frozen-lockfile", "--ignore-scripts"],
		{
			cwd: dependencies,
			stdio: "inherit",
			env: { ...process.env, CI: "true" },
		},
	);
	await rm(path.join(output, "node_modules"), { recursive: true, force: true });
	await cp(
		path.join(dependencies, "node_modules"),
		path.join(output, "node_modules"),
		{ recursive: true, verbatimSymlinks: true },
	);
} finally {
	await rm(dependencies, { recursive: true, force: true });
}
await build({
	entryPoints: entries.map((name) => `src/cms/scripts/${name}.ts`),
	outdir: path.join(output, "ops"),
	outExtension: { ".js": ".mjs" },
	bundle: true,
	packages: "external",
	platform: "node",
	format: "esm",
	target: "node22",
	tsconfig: "tsconfig.json",
});
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
	encoding: "utf8",
}).trim();
const manifest = {
	revision,
	platform: process.platform,
	arch: process.arch,
	nodeMajor: process.versions.node.split(".")[0],
	builtAt: new Date().toISOString(),
};
await writeFile(
	path.join(output, "release.json"),
	`${JSON.stringify(manifest, null, 2)}\n`,
);
const packageJSON = JSON.parse(await readFile("package.json", "utf8"));
await writeFile(
	path.join(output, "package.json"),
	JSON.stringify({ name: packageJSON.name, private: true, type: "module" }),
);
console.log(
	`Release ready: ${path.relative(root, output)} (${manifest.platform}/${manifest.arch})`,
);
