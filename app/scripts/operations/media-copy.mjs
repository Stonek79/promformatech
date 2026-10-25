import { createHash, randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import {
	chmod,
	copyFile,
	lstat,
	mkdir,
	readdir,
	realpath,
	rename,
	rm,
	rmdir,
} from "node:fs/promises";
import path from "node:path";
import {
	MEDIA_DELIVERY,
	MEDIA_KIND,
	MEDIA_VARIANTS,
} from "../../src/config/media-assets.ts";
import { MEDIA_STORAGE } from "../../src/config/media-storage.ts";
import { OPERATIONS } from "../../src/config/operations.ts";
import { OperationError } from "./database.mjs";

async function checksum(filename) {
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(filename)) {
		hash.update(chunk);
	}
	return hash.digest("hex");
}

async function filesBelow(root, relative = "") {
	const result = [];
	for (const name of await readdir(path.join(root, relative))) {
		const location = path.join(relative, name),
			information = await lstat(path.join(root, location));
		if (information.isSymbolicLink()) {
			throw new OperationError("Media snapshot must not contain symlinks");
		}
		if (information.isDirectory()) {
			result.push(...(await filesBelow(root, location)));
		} else if (information.isFile()) {
			result.push({ path: location, bytes: information.size });
		} else {
			throw new OperationError(
				"Media snapshot contains a special filesystem object",
			);
		}
	}
	return result;
}

export async function mediaInventory(root) {
	const entries = [];
	for (const folder of OPERATIONS.mediaDirectories) {
		const location = path.join(root, folder);
		try {
			if ((await lstat(location)).isSymbolicLink()) {
				throw new OperationError("Media snapshot must not contain symlinks");
			}
		} catch (error) {
			if (error.code === "ENOENT") {
				continue;
			}
			throw error;
		}
		for (const file of await filesBelow(root, folder)) {
			entries.push({
				...file,
				sha256: await checksum(path.join(root, file.path)),
			});
		}
	}
	return entries.sort((left, right) => left.path.localeCompare(right.path));
}

export async function prepareMedia(source, target, inventory) {
	const sourcePath = await realpath(source);
	await mkdir(path.dirname(path.resolve(target)), {
		recursive: true,
		mode: MEDIA_STORAGE.directoryMode,
	});
	const targetPath = path.join(
		await realpath(path.dirname(path.resolve(target))),
		path.basename(target),
	);
	if (
		targetPath === sourcePath ||
		targetPath.startsWith(`${sourcePath}${path.sep}`) ||
		sourcePath.startsWith(`${targetPath}${path.sep}`)
	) {
		throw new OperationError(
			"Source and target media directories must be separate",
		);
	}
	try {
		if ((await lstat(targetPath)).isSymbolicLink()) {
			throw new OperationError("Target media directory must not be a symlink");
		}
		const entries = await readdir(targetPath);
		if (entries.length) {
			throw new OperationError("Target media directory must be empty");
		}
	} catch (error) {
		if (error.code !== "ENOENT") {
			throw error;
		}
	}
	await mkdir(path.dirname(targetPath), {
		recursive: true,
		mode: MEDIA_STORAGE.directoryMode,
	});
	const staging = `${targetPath}.import-${randomUUID()}`;
	await mkdir(staging, { mode: MEDIA_STORAGE.directoryMode });
	try {
		for (const entry of inventory) {
			const destination = path.join(staging, entry.path);
			await mkdir(path.dirname(destination), {
				recursive: true,
				mode: MEDIA_STORAGE.directoryMode,
			});
			await copyFile(path.join(sourcePath, entry.path), destination);
			await chmod(destination, MEDIA_STORAGE.fileMode);
			if ((await checksum(destination)) !== entry.sha256) {
				throw new OperationError("Media snapshot changed during copy");
			}
		}
		return {
			publish: async () => {
				try {
					await rmdir(targetPath);
				} catch (error) {
					if (error.code !== "ENOENT") {
						throw error;
					}
				}
				await rename(staging, targetPath);
			},
			cleanup: () => rm(staging, { recursive: true, force: true }),
		};
	} catch (error) {
		await rm(staging, { recursive: true, force: true });
		throw error;
	}
}

export async function verifyMediaReferences(client, inventory) {
	const available = new Set(inventory.map((entry) => entry.path));
	const keyPattern = /^[a-f\d-]{36}$/;
	for (const { table, prefix } of OPERATIONS.mediaTables) {
		const { rows } = await client.query(
			`SELECT ${prefix}storage_key AS key, ${prefix}derivative_key AS derivative, ${prefix}kind AS kind, ${prefix}processing_status AS status FROM "${table}" WHERE ${prefix}storage_key IS NOT NULL`,
		);
		for (const row of rows) {
			if (!keyPattern.test(row.key)) {
				throw new OperationError("Invalid media storage key in source data");
			}
			if (
				!available.has(
					path.join(MEDIA_STORAGE.originals, row.key, MEDIA_DELIVERY.original),
				)
			) {
				throw new OperationError(
					"Source media snapshot is missing a referenced original",
				);
			}
			if (row.status !== OPERATIONS.readyStatus) {
				continue;
			}
			if (!keyPattern.test(row.derivative || "")) {
				throw new OperationError("Ready media is missing its derivative key");
			}
			const variants =
				row.kind === MEDIA_KIND.image
					? [MEDIA_VARIANTS.image, MEDIA_VARIANTS.small, MEDIA_VARIANTS.medium]
					: [MEDIA_VARIANTS.video, MEDIA_VARIANTS.poster];
			for (const variant of variants) {
				if (
					!available.has(
						path.join(
							MEDIA_STORAGE.derived,
							row.key,
							row.derivative,
							variant.file,
						),
					)
				) {
					throw new OperationError(
						"Source media snapshot is missing a referenced derivative",
					);
				}
			}
		}
	}
}
