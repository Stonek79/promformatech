import { type MigrateUpArgs, sql } from "@payloadcms/db-sqlite";
export async function part6({ db }: MigrateUpArgs): Promise<void> {
	await db.run(
		sql`CREATE INDEX \`site_settings__status_idx\` ON \`site_settings\` (\`_status\`);`,
	);
	await db.run(sql`CREATE TABLE \`site_settings_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`site_settings_rels_order_idx\` ON \`site_settings_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`site_settings_rels_parent_idx\` ON \`site_settings_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`site_settings_rels_path_idx\` ON \`site_settings_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`site_settings_rels_media_id_idx\` ON \`site_settings_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_site_settings_v_version_locations_people\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`position\` text,
  	\`phone\` text,
  	\`email\` text,
  	\`messenger_u_r_l\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_settings_v_version_locations\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_locations_people_order_idx\` ON \`_site_settings_v_version_locations_people\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_locations_people_parent_id_idx\` ON \`_site_settings_v_version_locations_people\` (\`_parent_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_site_settings_v_version_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`address\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_locations_order_idx\` ON \`_site_settings_v_version_locations\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_locations_parent_id_idx\` ON \`_site_settings_v_version_locations\` (\`_parent_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_site_settings_v_version_navigation\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`visible\` integer DEFAULT true,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_navigation_order_idx\` ON \`_site_settings_v_version_navigation\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_navigation_parent_id_idx\` ON \`_site_settings_v_version_navigation\` (\`_parent_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_site_settings_v_version_footer_links\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`url\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_site_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_footer_links_order_idx\` ON \`_site_settings_v_version_footer_links\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_footer_links_parent_id_idx\` ON \`_site_settings_v_version_footer_links\` (\`_parent_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_site_settings_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`version_company_name\` text,
  	\`version_tagline\` text,
  	\`version_logo_id\` integer,
  	\`version_footer_logo_id\` integer,
  	\`version_phone\` text,
  	\`version_email\` text,
  	\`version_address\` text,
  	\`version_hours\` text,
  	\`version_copyright\` text,
  	\`version_labels_search_title\` text,
  	\`version_labels_search_placeholder\` text,
  	\`version_labels_search_button\` text,
  	\`version_labels_empty_search\` text,
  	\`version_labels_empty_list\` text,
  	\`version_labels_read_more\` text,
  	\`version_labels_contact_title\` text,
  	\`version_labels_task\` text,
  	\`version_labels_solution\` text,
  	\`version_labels_result\` text,
  	\`version_labels_gallery\` text,
  	\`version_labels_specifications\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_image_id\` integer,
  	\`version_seo_no_index\` integer DEFAULT false,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`version_logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_footer_logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_version_logo_idx\` ON \`_site_settings_v\` (\`version_logo_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_version_footer_logo_idx\` ON \`_site_settings_v\` (\`version_footer_logo_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_seo_version_seo_image_idx\` ON \`_site_settings_v\` (\`version_seo_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_version_version__status_idx\` ON \`_site_settings_v\` (\`version__status\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_created_at_idx\` ON \`_site_settings_v\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_updated_at_idx\` ON \`_site_settings_v\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_latest_idx\` ON \`_site_settings_v\` (\`latest\`);`,
	);
	await db.run(sql`CREATE TABLE \`_site_settings_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_site_settings_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_rels_order_idx\` ON \`_site_settings_v_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_rels_parent_idx\` ON \`_site_settings_v_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_rels_path_idx\` ON \`_site_settings_v_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_site_settings_v_rels_media_id_idx\` ON \`_site_settings_v_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`service_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `);
}
