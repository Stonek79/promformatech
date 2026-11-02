export const MIGRATION_POLICY = {
	required: ["20261030_161831_initial"],
	minimumBatch: 1,
	ledgerTable: "payload_migrations",
} as const;
