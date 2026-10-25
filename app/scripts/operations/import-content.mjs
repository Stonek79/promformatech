import { mkdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { OPERATIONS } from "../../src/config/operations.ts";
import { isBuildPhase } from "../../src/config/runtime.ts";
import { copyTable, restoreSequences, tableDigest } from "./content-copy.mjs";
import {
	connectDatabase,
	loadEnvironment,
	OperationError,
	qualifiedTable,
	reportError,
} from "./database.mjs";
import { prepareMedia } from "./media-copy.mjs";
import { dependencyOrder } from "./schema-inspection.mjs";
import { transferSettings, validateTransfer } from "./transfer-validation.mjs";

async function main() {
	loadEnvironment();
	if (isBuildPhase()) {
		throw new OperationError("Build processes must not import runtime content");
	}
	const settings = transferSettings();
	const source = await connectDatabase(settings.sourceURL);
	let target;
	let copiedMedia,
		committed = false;
	try {
		target = await connectDatabase(settings.targetURL);
		const {
			schema: sourceSchema,
			tables,
			inventory,
			manifest,
		} = await validateTransfer(source, target, settings);
		const apply = process.argv.includes("--apply");
		if (!apply) {
			for (const table of tables) {
				manifest.tables[table] = await tableDigest(source, table);
			}
			console.log(
				JSON.stringify({
					mode: "dry-run",
					schema: manifest.schema,
					tables: tables.length,
					media: inventory.length,
				}),
			);
			return;
		}
		if (process.env.IMPORT_CONFIRM !== OPERATIONS.confirmation) {
			throw new OperationError(
				"Explicit IMPORT_CONFIRM is required for writes",
			);
		}
		const reportDirectory = path.resolve(
			process.env.IMPORT_REPORT_DIR || "private/operations",
		);
		await mkdir(reportDirectory, { recursive: true, mode: 0o700 });
		const report = path.join(reportDirectory, OPERATIONS.manifestFilename);
		await writeFile(
			report,
			JSON.stringify({ ...manifest, state: "prepared" }, null, 2),
			{ mode: 0o600, flag: "wx" },
		);
		copiedMedia = await prepareMedia(
			settings.sourceMedia,
			settings.targetMedia,
			inventory,
		);
		const ordered = await dependencyOrder(source, tables);
		for (const table of ordered) {
			const expected = await copyTable(source, target, table, sourceSchema);
			const actual = await tableDigest(target, table);
			if (JSON.stringify(expected) !== JSON.stringify(actual)) {
				throw new OperationError(`Data checksum mismatch: ${table}`);
			}
			manifest.tables[table] = expected;
		}
		await restoreSequences(source, target, tables, sourceSchema);
		await target.query(
			`INSERT INTO ${qualifiedTable("payload_kv")} (key,data) VALUES ($1,$2)`,
			[
				OPERATIONS.importReceiptKey,
				JSON.stringify({
					id: manifest.id,
					schema: manifest.schema,
					tables: manifest.tables,
				}),
			],
		);
		await copiedMedia.publish();
		await target.query("COMMIT");
		committed = true;
		manifest.state = "committed";
		await writeFile(`${report}.tmp`, JSON.stringify(manifest, null, 2), {
			mode: 0o600,
			flag: "wx",
		});
		await rename(`${report}.tmp`, report);
		console.log(
			JSON.stringify({
				mode: "imported",
				id: manifest.id,
				tables: tables.length,
				media: inventory.length,
			}),
		);
	} finally {
		if (target && !committed) {
			await target.query("ROLLBACK").catch(() => {});
		}
		await source.query("ROLLBACK").catch(() => {});
		await copiedMedia?.cleanup();
		await Promise.all([source.end(), target?.end()]);
	}
}

await main().catch(reportError);
