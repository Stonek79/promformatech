import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-sqlite";

export async function up({ db }: MigrateUpArgs): Promise<void> {
	await db.run(
		sql`ALTER TABLE \`site_settings_locations\` ADD \`map_visible\` integer DEFAULT true;`,
	);
	await db.run(
		sql`ALTER TABLE \`site_settings_locations\` ADD \`map_position\` text DEFAULT 'beside';`,
	);
	await db.run(
		sql`ALTER TABLE \`site_settings_locations\` ADD \`map_url\` text;`,
	);
	await db.run(
		sql`ALTER TABLE \`site_settings_locations\` ADD \`map_map_preview_id\` integer REFERENCES media(id);`,
	);
	await db.run(
		sql`CREATE INDEX \`site_settings_locations_map_map_map_preview_idx\` ON \`site_settings_locations\` (\`map_map_preview_id\`);`,
	);
	await db.run(
		sql`ALTER TABLE \`_site_settings_v_version_locations\` ADD \`map_visible\` integer DEFAULT true;`,
	);
	await db.run(
		sql`ALTER TABLE \`_site_settings_v_version_locations\` ADD \`map_position\` text DEFAULT 'beside';`,
	);
	await db.run(
		sql`ALTER TABLE \`_site_settings_v_version_locations\` ADD \`map_url\` text;`,
	);
	await db.run(
		sql`ALTER TABLE \`_site_settings_v_version_locations\` ADD \`map_map_preview_id\` integer REFERENCES media(id);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_locations_map_map_map_preview_idx\` ON \`_site_settings_v_version_locations\` (\`map_map_preview_id\`);`,
	);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	await db.run(
		sql`DROP INDEX site_settings_locations_map_map_map_preview_idx;`,
	);
	await db.run(
		sql`ALTER TABLE site_settings_locations DROP COLUMN map_map_preview_id;`,
	);
	await db.run(sql`ALTER TABLE site_settings_locations DROP COLUMN map_url;`);
	await db.run(
		sql`ALTER TABLE site_settings_locations DROP COLUMN map_position;`,
	);
	await db.run(
		sql`ALTER TABLE site_settings_locations DROP COLUMN map_visible;`,
	);
	await db.run(
		sql`DROP INDEX _site_settings_v_version_locations_map_map_map_preview_idx;`,
	);
	await db.run(
		sql`ALTER TABLE _site_settings_v_version_locations DROP COLUMN map_map_preview_id;`,
	);
	await db.run(
		sql`ALTER TABLE _site_settings_v_version_locations DROP COLUMN map_url;`,
	);
	await db.run(
		sql`ALTER TABLE _site_settings_v_version_locations DROP COLUMN map_position;`,
	);
	await db.run(
		sql`ALTER TABLE _site_settings_v_version_locations DROP COLUMN map_visible;`,
	);
}
