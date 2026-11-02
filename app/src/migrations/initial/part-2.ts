import { type MigrateUpArgs, sql } from "@payloadcms/db-sqlite";
export async function part2({ db }: MigrateUpArgs): Promise<void> {
	await db.run(
		sql`CREATE INDEX \`products_updated_at_idx\` ON \`products\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`products_created_at_idx\` ON \`products\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`products__status_idx\` ON \`products\` (\`_status\`);`,
	);
	await db.run(sql`CREATE TABLE \`products_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`products_rels_order_idx\` ON \`products_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`products_rels_parent_idx\` ON \`products_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`products_rels_path_idx\` ON \`products_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`products_rels_media_id_idx\` ON \`products_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_products_v_version_specifications\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`value\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_specifications_order_idx\` ON \`_products_v_version_specifications\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_specifications_parent_id_idx\` ON \`_products_v_version_specifications\` (\`_parent_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_products_v_version_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`asset_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`asset_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_gallery_order_idx\` ON \`_products_v_version_gallery\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_gallery_parent_id_idx\` ON \`_products_v_version_gallery\` (\`_parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_gallery_asset_idx\` ON \`_products_v_version_gallery\` (\`asset_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`_products_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_summary\` text,
  	\`version_category\` text,
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
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`products\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_featured_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_products_v_parent_idx\` ON \`_products_v\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_version_featured_image_idx\` ON \`_products_v\` (\`version_featured_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_version_slug_idx\` ON \`_products_v\` (\`version_slug\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_seo_version_seo_image_idx\` ON \`_products_v\` (\`version_seo_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_version_updated_at_idx\` ON \`_products_v\` (\`version_updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_version_created_at_idx\` ON \`_products_v\` (\`version_created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_version_version__status_idx\` ON \`_products_v\` (\`version__status\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_created_at_idx\` ON \`_products_v\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_updated_at_idx\` ON \`_products_v\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_latest_idx\` ON \`_products_v\` (\`latest\`);`,
	);
	await db.run(sql`CREATE TABLE \`_products_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_products_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_products_v_rels_order_idx\` ON \`_products_v_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_rels_parent_idx\` ON \`_products_v_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_rels_path_idx\` ON \`_products_v_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_products_v_rels_media_id_idx\` ON \`_products_v_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`services_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`asset_id\` integer,
  	\`caption\` text,
  	FOREIGN KEY (\`asset_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`services_gallery_order_idx\` ON \`services_gallery\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_gallery_parent_id_idx\` ON \`services_gallery\` (\`_parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_gallery_asset_idx\` ON \`services_gallery\` (\`asset_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`services\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`summary\` text,
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
		sql`CREATE INDEX \`services_featured_image_idx\` ON \`services\` (\`featured_image_id\`);`,
	);
	await db.run(
		sql`CREATE UNIQUE INDEX \`services_slug_idx\` ON \`services\` (\`slug\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_seo_seo_image_idx\` ON \`services\` (\`seo_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_updated_at_idx\` ON \`services\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_created_at_idx\` ON \`services\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services__status_idx\` ON \`services\` (\`_status\`);`,
	);
	await db.run(sql`CREATE TABLE \`services_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`services\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`services_rels_order_idx\` ON \`services_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_rels_parent_idx\` ON \`services_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_rels_path_idx\` ON \`services_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`services_rels_media_id_idx\` ON \`services_rels\` (\`media_id\`);`,
	);
}
