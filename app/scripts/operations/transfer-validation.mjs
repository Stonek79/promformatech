import { randomUUID } from "node:crypto";
import {
	OperationError,
	operationLock,
	verifyMigrationLedger,
} from "./database.mjs";
import { verifyJobState } from "./job-validation.mjs";
import { mediaInventory, verifyMediaReferences } from "./media-copy.mjs";
import {
	assertEmptyTables,
	contentTables,
	schemaDescription,
	schemaHash,
} from "./schema-inspection.mjs";

const DATABASE_IDENTITY_SQL =
	"SELECT current_database() AS name, (SELECT oid FROM pg_database WHERE datname=current_database())::text AS oid, pg_postmaster_start_time()::text AS started, inet_server_port() AS port";

export function transferSettings() {
	const sourceURL = process.env.SOURCE_DATABASE_URL,
		targetURL = process.env.DATABASE_URL;
	const sourceMedia = process.env.SOURCE_MEDIA_ROOT,
		targetMedia = process.env.MEDIA_ROOT;
	if (!sourceURL || !targetURL || !sourceMedia || !targetMedia) {
		throw new OperationError(
			"SOURCE_DATABASE_URL, DATABASE_URL, SOURCE_MEDIA_ROOT and MEDIA_ROOT are required",
		);
	}
	return { sourceURL, targetURL, sourceMedia, targetMedia };
}

export async function validateTransfer(source, target, settings) {
	await operationLock(target);
	const sourceID = (await source.query(DATABASE_IDENTITY_SQL)).rows[0];
	const targetID = (await target.query(DATABASE_IDENTITY_SQL)).rows[0];
	if (JSON.stringify(sourceID) === JSON.stringify(targetID)) {
		throw new OperationError("Source and target database must be different");
	}
	await verifyMigrationLedger(target);
	await source.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
	await target.query("BEGIN");
	const schema = await schemaDescription(source),
		targetSchema = await schemaDescription(target);
	const fingerprint = schemaHash(schema);
	if (fingerprint !== schemaHash(targetSchema)) {
		throw new OperationError(
			"Schema mismatch: an explicit reviewed transformation is required",
		);
	}
	const tables = contentTables(schema);
	await assertEmptyTables(target, tables);
	await verifyJobState(source);
	const inventory = await mediaInventory(settings.sourceMedia);
	await verifyMediaReferences(source, inventory);
	return {
		schema,
		tables,
		inventory,
		manifest: {
			id: randomUUID(),
			createdAt: new Date().toISOString(),
			schema: fingerprint,
			tables: {},
			media: inventory,
			state: "checked",
		},
	};
}
