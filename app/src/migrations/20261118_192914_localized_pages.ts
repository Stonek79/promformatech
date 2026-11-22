import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-sqlite";
import {
	restoreRussianBlocks,
	storeRussianBlocks,
} from "./localization/blocks";

const origin = "ru";
const scopes = [
	{ table: "pages", prefix: "" },
	{ table: "_pages_v", prefix: "version_" },
] as const;
const fields = ["title", "heading", "seo_title", "seo_description"] as const;
const stockPageNames = [
	["home", "Главная", "Home", "Startseite"],
	["about", "О компании", "About us", "Über uns"],
	["products", "Наша продукция", "Products", "Produkte"],
	["services", "Услуги", "Services", "Leistungen"],
	["projects", "Реализованные проекты", "Completed projects", "Referenzen"],
	["contacts", "Контакты", "Contact", "Kontakt"],
] as const;
type Database = MigrateUpArgs["db"];
type Scope = (typeof scopes)[number];

async function preserveStockTitles(db: Database, scope: Scope) {
	const table = sql.identifier(scope.table);
	const locales = sql.identifier(`${scope.table}_locales`);
	const slug = sql.identifier(`${scope.prefix}slug`);
	const title = sql.identifier(`${scope.prefix}title`);
	const heading = sql.identifier(`${scope.prefix}heading`);
	const seoTitle = sql.identifier(`${scope.prefix}seo_title`);
	// Restore the stock translations previously supplied by the site, while leaving custom text in Russian.
	const rows = await db.all<{
		id: number;
		slug: string;
		title: string | null;
		heading: string | null;
		seo: string | null;
	}>(
		sql`SELECT id, ${slug} AS slug, ${title} AS title, ${heading} AS heading, ${seoTitle} AS seo FROM ${table}`,
	);
	for (const row of rows) {
		const stock = stockPageNames.find(([pageSlug]) => pageSlug === row.slug);
		if (!stock) {
			continue;
		}
		const [, russian, en, de] = stock;
		const matches = (value?: string | null) =>
			value?.trim().toLocaleLowerCase(origin) ===
			russian.toLocaleLowerCase(origin);
		if (!matches(row.title) && !matches(row.heading) && !matches(row.seo)) {
			continue;
		}
		for (const [locale, value] of [
			["en", en],
			["de", de],
		] as const) {
			await db.run(sql`
				INSERT INTO ${locales} (_parent_id, _locale, ${title}, ${heading}, ${seoTitle})
				VALUES (${row.id}, ${locale}, ${matches(row.title) ? value : null},
					${matches(row.heading) ? value : null}, ${matches(row.seo) ? value : null})
			`);
		}
	}
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
	for (const scope of scopes) {
		const table = sql.identifier(scope.table);
		const name = `${scope.table}_locales`;
		const locales = sql.identifier(name);
		const columns = fields.map((field) => sql.identifier(scope.prefix + field));
		const list = sql.join(columns, sql`, `);
		const definitions = sql.join(
			columns.map((field) => sql`${field} text`),
			sql`, `,
		);
		await db.run(sql`
			CREATE TABLE ${locales} (
				${definitions}, id integer PRIMARY KEY NOT NULL, _locale text NOT NULL, _parent_id integer NOT NULL,
				FOREIGN KEY (_parent_id) REFERENCES ${table}(id) ON DELETE CASCADE
			)
		`);
		await db.run(
			sql`CREATE UNIQUE INDEX ${sql.identifier(`${name}_locale_parent_id_unique`)} ON ${locales} (_locale, _parent_id)`,
		);
		await db.run(
			sql`CREATE INDEX ${sql.identifier(`${name}_parent_id_idx`)} ON ${locales} (_parent_id)`,
		);
		await db.run(sql`
			INSERT INTO ${locales} (_parent_id, _locale, ${list})
			SELECT id, ${origin}, ${list} FROM ${table}
		`);
		await preserveStockTitles(db, scope);
		await storeRussianBlocks(db, scope.table, `${scope.prefix}blocks`);
		for (const column of columns) {
			await db.run(sql`ALTER TABLE ${table} DROP COLUMN ${column}`);
		}
	}
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	for (const scope of scopes) {
		const table = sql.identifier(scope.table);
		const locales = sql.identifier(`${scope.table}_locales`);
		for (const field of fields) {
			const column = sql.identifier(scope.prefix + field);
			await db.run(sql`ALTER TABLE ${table} ADD COLUMN ${column} text`);
			await db.run(sql`
				UPDATE ${table} AS parent SET ${column} = (
					SELECT ${column} FROM ${locales} WHERE _parent_id = parent.id
					ORDER BY _locale <> ${origin}, _locale LIMIT 1
				)
			`);
		}
		await restoreRussianBlocks(db, scope.table, `${scope.prefix}blocks`);
		await db.run(sql`DROP TABLE ${locales}`);
	}
}
