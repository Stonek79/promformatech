import { execFileSync } from "node:child_process";
import {
	cp,
	lstat,
	mkdir,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import fileTracer from "next/dist/compiled/@vercel/nft/index.js";

const root = process.cwd();
const output = path.resolve("artifacts/release");
const nextDirectory = process.env.NEXT_OUTPUT_DIR || ".next";
const entries = ["worker", "migrate", "seed", "create-owner"];
const ops = path.join(output, "ops");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await build({
	entryPoints: entries.map((name) => `src/cms/scripts/${name}.ts`),
	outdir: ops,
	outExtension: { ".js": ".mjs" },
	bundle: true,
	packages: "external",
	platform: "node",
	format: "esm",
	target: "node22",
	tsconfig: "tsconfig.json",
});
// Resolve CLI dependencies against the install, before copying Next's partial tree.
const { fileList } = await fileTracer.nodeFileTrace(
	entries.map((name) => path.join(ops, `${name}.mjs`)),
	{ base: root, processCwd: root, mixedModules: true },
);
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
// Keep the original pnpm paths and links so web and CLI can share traced files.
for (const file of fileList) {
	if (!file.startsWith(`node_modules${path.sep}`)) {
		continue;
	}
	const source = path.join(root, file);
	if (!(await lstat(source)).isDirectory()) {
		await cp(source, path.join(output, file), { verbatimSymlinks: true });
	}
}
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
