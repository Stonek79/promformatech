import { type MigrateUpArgs, sql } from "@payloadcms/db-sqlite";
export async function part3({ db }: MigrateUpArgs): Promise<void> {
	await db.run(sql`CREATE TABLE \`_services_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`asset_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`asset_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_services_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_gallery_order_idx\` ON \`_services_v_version_gallery\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_gallery_parent_id_idx\` ON \`_services_v_version_gallery\` (\`_parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_gallery_asset_idx\` ON \`_services_v_version_gallery\` (\`asset_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_services_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_blocks\` text DEFAULT '[]',
  	\`version_featured_image_id\` integer,
  	\`version_slug\` text,
  	\`version_order\` numeric DEFAULT 0,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_image_id\` integer,
  	\`version_seo_no_index\` integer DEFAULT false,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_services_v_parent_idx\` ON \`_services_v\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_version_featured_image_idx\` ON \`_services_v\` (\`version_featured_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_version_slug_idx\` ON \`_services_v\` (\`version_slug\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_seo_version_seo_image_idx\` ON \`_services_v\` (\`version_seo_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_version_updated_at_idx\` ON \`_services_v\` (\`version_updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_version_created_at_idx\` ON \`_services_v\` (\`version_created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_version_version__status_idx\` ON \`_services_v\` (\`version__status\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_created_at_idx\` ON \`_services_v\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_updated_at_idx\` ON \`_services_v\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_latest_idx\` ON \`_services_v\` (\`latest\`);`,
	);
	await db.run(sql`CREATE TABLE \`_services_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_services_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_services_v_rels_order_idx\` ON \`_services_v_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_rels_parent_idx\` ON \`_services_v_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_rels_path_idx\` ON \`_services_v_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_services_v_rels_media_id_idx\` ON \`_services_v_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`projects_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`asset_id\` integer,
  	\`caption\` text,
  	FOREIGN KEY (\`asset_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`projects_gallery_order_idx\` ON \`projects_gallery\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_gallery_parent_id_idx\` ON \`projects_gallery\` (\`_parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_gallery_asset_idx\` ON \`projects_gallery\` (\`asset_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`projects\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`summary\` text,
  	\`task\` text,
  	\`solution\` text,
  	\`result\` text,
  	\`client\` text,
  	\`location\` text,
  	\`blocks\` text DEFAULT '[]',
  	\`featured_image_id\` integer,
  	\`slug\` text,
  	\`order\` numeric DEFAULT 0,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_image_id\` integer,
  	\`seo_no_index\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
	await db.run(
		sql`CREATE INDEX \`projects_featured_image_idx\` ON \`projects\` (\`featured_image_id\`);`,
	);
	await db.run(
		sql`CREATE UNIQUE INDEX \`projects_slug_idx\` ON \`projects\` (\`slug\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_seo_seo_image_idx\` ON \`projects\` (\`seo_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_updated_at_idx\` ON \`projects\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_created_at_idx\` ON \`projects\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects__status_idx\` ON \`projects\` (\`_status\`);`,
	);
	await db.run(sql`CREATE TABLE \`projects_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`projects_rels_order_idx\` ON \`projects_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_rels_parent_idx\` ON \`projects_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_rels_path_idx\` ON \`projects_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`projects_rels_media_id_idx\` ON \`projects_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_projects_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`asset_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`asset_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_gallery_order_idx\` ON \`_projects_v_version_gallery\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_gallery_parent_id_idx\` ON \`_projects_v_version_gallery\` (\`_parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_gallery_asset_idx\` ON \`_projects_v_version_gallery\` (\`asset_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_projects_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_task\` text,
  	\`version_solution\` text,
  	\`version_result\` text,
  	\`version_client\` text,
  	\`version_location\` text,
  	\`version_blocks\` text DEFAULT '[]',
  	\`version_featured_image_id\` integer,
  	\`version_slug\` text,
  	\`version_order\` numeric DEFAULT 0,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_image_id\` integer,
  	\`version_seo_no_index\` integer DEFAULT false,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
}
