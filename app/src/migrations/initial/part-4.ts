import { type MigrateUpArgs, sql } from "@payloadcms/db-sqlite";
export async function part4({ db }: MigrateUpArgs): Promise<void> {
	await db.run(
		sql`CREATE INDEX \`_projects_v_parent_idx\` ON \`_projects_v\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_version_featured_image_idx\` ON \`_projects_v\` (\`version_featured_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_version_slug_idx\` ON \`_projects_v\` (\`version_slug\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_seo_version_seo_image_idx\` ON \`_projects_v\` (\`version_seo_image_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_version_updated_at_idx\` ON \`_projects_v\` (\`version_updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_version_created_at_idx\` ON \`_projects_v\` (\`version_created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_version_version__status_idx\` ON \`_projects_v\` (\`version__status\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_created_at_idx\` ON \`_projects_v\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_updated_at_idx\` ON \`_projects_v\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_latest_idx\` ON \`_projects_v\` (\`latest\`);`,
	);
	await db.run(sql`CREATE TABLE \`_projects_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_projects_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_projects_v_rels_order_idx\` ON \`_projects_v_rels\` (\`order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_rels_parent_idx\` ON \`_projects_v_rels\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_rels_path_idx\` ON \`_projects_v_rels\` (\`path\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_projects_v_rels_media_id_idx\` ON \`_projects_v_rels\` (\`media_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`seed_key\` text,
  	\`title\` text,
  	\`alt\` text,
  	\`caption\` text,
  	\`caption_track\` text,
  	\`has_captions\` integer,
  	\`processing_status\` text DEFAULT 'queued',
  	\`error\` text,
  	\`archived\` integer DEFAULT false,
  	\`kind\` text,
  	\`storage_key\` text,
  	\`derivative_key\` text,
  	\`duration\` numeric,
  	\`optimized_bytes\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric
  );
  `);
	await db.run(
		sql`CREATE UNIQUE INDEX \`media_seed_key_idx\` ON \`media\` (\`seed_key\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`media__status_idx\` ON \`media\` (\`_status\`);`,
	);
	await db.run(
		sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`,
	);
	await db.run(sql`CREATE TABLE \`_media_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_seed_key\` text,
  	\`version_title\` text,
  	\`version_alt\` text,
  	\`version_caption\` text,
  	\`version_caption_track\` text,
  	\`version_has_captions\` integer,
  	\`version_processing_status\` text DEFAULT 'queued',
  	\`version_error\` text,
  	\`version_archived\` integer DEFAULT false,
  	\`version_kind\` text,
  	\`version_storage_key\` text,
  	\`version_derivative_key\` text,
  	\`version_duration\` numeric,
  	\`version_optimized_bytes\` numeric,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`version_url\` text,
  	\`version_thumbnail_u_r_l\` text,
  	\`version_filename\` text,
  	\`version_mime_type\` text,
  	\`version_filesize\` numeric,
  	\`version_width\` numeric,
  	\`version_height\` numeric,
  	\`version_focal_x\` numeric,
  	\`version_focal_y\` numeric,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
	await db.run(
		sql`CREATE INDEX \`_media_v_parent_idx\` ON \`_media_v\` (\`parent_id\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_version_version_seed_key_idx\` ON \`_media_v\` (\`version_seed_key\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_version_version_updated_at_idx\` ON \`_media_v\` (\`version_updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_version_version_created_at_idx\` ON \`_media_v\` (\`version_created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_version_version__status_idx\` ON \`_media_v\` (\`version__status\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_version_version_filename_idx\` ON \`_media_v\` (\`version_filename\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_created_at_idx\` ON \`_media_v\` (\`created_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_updated_at_idx\` ON \`_media_v\` (\`updated_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`_media_v_latest_idx\` ON \`_media_v\` (\`latest\`);`,
	);
	await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `);
	await db.run(
		sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`,
	);
	await db.run(sql`CREATE TABLE \`payload_jobs_log\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`executed_at\` text NOT NULL,
  	\`completed_at\` text NOT NULL,
  	\`task_slug\` text NOT NULL,
  	\`task_i_d\` text NOT NULL,
  	\`input\` text,
  	\`output\` text,
  	\`state\` text NOT NULL,
  	\`error\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`payload_jobs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_log_order_idx\` ON \`payload_jobs_log\` (\`_order\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_log_parent_id_idx\` ON \`payload_jobs_log\` (\`_parent_id\`);`,
	);
	await db.run(sql`CREATE TABLE \`payload_jobs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`input\` text,
  	\`completed_at\` text,
  	\`total_tried\` numeric DEFAULT 0,
  	\`has_error\` integer DEFAULT false,
  	\`error\` text,
  	\`task_slug\` text,
  	\`queue\` text DEFAULT 'default',
  	\`wait_until\` text,
  	\`processing\` integer DEFAULT false,
  	\`concurrency_key\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_completed_at_idx\` ON \`payload_jobs\` (\`completed_at\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_total_tried_idx\` ON \`payload_jobs\` (\`total_tried\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_has_error_idx\` ON \`payload_jobs\` (\`has_error\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_task_slug_idx\` ON \`payload_jobs\` (\`task_slug\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_queue_idx\` ON \`payload_jobs\` (\`queue\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_wait_until_idx\` ON \`payload_jobs\` (\`wait_until\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_processing_idx\` ON \`payload_jobs\` (\`processing\`);`,
	);
	await db.run(
		sql`CREATE INDEX \`payload_jobs_concurrency_key_idx\` ON \`payload_jobs\` (\`concurrency_key\`);`,
	);
}
