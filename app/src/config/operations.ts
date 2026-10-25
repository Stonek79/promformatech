export const OPERATIONS = {
	schema: "public",
	lockKey: 0x504655,
	copyBatchRows: 100,
	confirmation: "IMPORT_INTO_EMPTY_MIGRATED_DATABASE",
	excludedTables: [
		"payload_migrations",
		"payload_kv",
		"payload_locked_documents",
		"payload_locked_documents_rels",
		"rate_limits",
	],
	excludedPrefixes: ["payload_locked_documents_"],
	mediaDirectories: ["originals", "derived"],
	ledger: "payload_migrations",
	importReceiptKey: "promformatech:content-import",
	manifestFilename: "content-import.json",
	mediaTables: [
		{ table: "media", prefix: "" },
		{ table: "_media_v", prefix: "version_" },
	],
	readyStatus: "ready",
} as const;
