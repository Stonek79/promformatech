export const MIGRATION_POLICY = {
	required: [
		"20261030_161831_initial",
		"20261118_125548_contact_maps",
		"20261118_135524_localized_contacts",
		"20261118_190149_localized_site_settings",
		"20261118_192914_localized_pages",
		"20261118_195013_localized_materials",
	],
	minimumBatch: 1,
	ledgerTable: "payload_migrations",
} as const;
