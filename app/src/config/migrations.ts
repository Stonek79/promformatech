export const MIGRATION_POLICY = {
	required: ["20261022_221745_initial"],
	minimumBatch: 1,
	ledgerTable: "payload_migrations",
} as const;
