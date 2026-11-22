import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-sqlite";

const scopes = [
	{
		settings: "site_settings",
		rows: "site_settings",
		version: false,
		indexes: [
			"site_settings_locations_people_locales_locale_parent_id_uniq",
			"site_settings_navigation_locales_locale_parent_id_unique",
			"site_settings_footer_links_locales_locale_parent_id_unique",
		],
		peopleParentIndex: "site_settings_locations_people_locales_parent_id_idx",
	},
	{
		settings: "_site_settings_v",
		rows: "_site_settings_v_version",
		version: true,
		indexes: [
			"_site_settings_v_version_locations_people_locales_locale_par",
			"_site_settings_v_version_navigation_locales_locale_parent_id",
			"_site_settings_v_version_footer_links_locales_locale_parent_",
		],
		peopleParentIndex:
			"_site_settings_v_version_locations_people_locales_parent_idx",
	},
] as const;

const stockMenu = [
	["/", "Главная", "Home", "Startseite"],
	["/about", "О компании", "About us", "Über uns"],
	["/products", "Наша продукция", "Products", "Produkte"],
	["/services", "Услуги", "Services", "Leistungen"],
	["/projects", "Реализованные проекты", "Completed projects", "Referenzen"],
	["/contacts", "Контакты", "Contact", "Kontakt"],
] as const;

type Database = MigrateUpArgs["db"];
type Scope = (typeof scopes)[number];
type LegacyFooter = {
	id: number;
	company: string | null;
	heading: string | null;
	hours: string | null;
	copyright: string | null;
};

const originalLocale = "ru";
const otherLocales = ["en", "de"] as const;
const defaultHeading = "Контакты";
const hoursPattern = /^с (\d{1,2}:\d{2}) до (\d{1,2}:\d{2})$/;
const yearPattern = /^© (\d{4})\./;

function rowFields(scope: Scope) {
	return [
		{ table: `${scope.rows}_locations_people`, column: "position" },
		{ table: `${scope.rows}_navigation`, column: "label" },
		{ table: `${scope.rows}_footer_links`, column: "label" },
	] as const;
}

function footerFields(scope: Scope) {
	const prefix = scope.version ? "version_" : "";
	return [
		{ before: `${prefix}labels_contact_title`, after: `${prefix}footer_title` },
		{ before: `${prefix}hours`, after: `${prefix}hours` },
		{ before: `${prefix}copyright`, after: `${prefix}copyright` },
	] as const;
}

async function createLocales(
	db: Database,
	parent: string,
	parentType: "text" | "integer",
	columns: readonly string[],
	localeIndex: string,
	parentIndex: string,
) {
	const locales = sql.identifier(`${parent}_locales`);
	const fields = sql.join(
		columns.map((name) => sql`${sql.identifier(name)} text`),
		sql`, `,
	);
	await db.run(sql`
		CREATE TABLE ${locales} (
			${fields}, id integer PRIMARY KEY NOT NULL, _locale text NOT NULL,
			_parent_id ${sql.raw(parentType)} NOT NULL,
			FOREIGN KEY (_parent_id) REFERENCES ${sql.identifier(parent)}(id) ON DELETE CASCADE
		)
	`);
	await db.run(
		sql`CREATE UNIQUE INDEX ${sql.identifier(localeIndex)} ON ${locales} (_locale, _parent_id)`,
	);
	await db.run(
		sql`CREATE INDEX ${sql.identifier(parentIndex)} ON ${locales} (_parent_id)`,
	);
}

async function copyRussian(db: Database, parent: string, column: string) {
	const field = sql.identifier(column);
	await db.run(sql`
		INSERT INTO ${sql.identifier(`${parent}_locales`)} (_parent_id, _locale, ${field})
		SELECT id, ${originalLocale}, ${field} FROM ${sql.identifier(parent)} WHERE ${field} IS NOT NULL
		ON CONFLICT (_locale, _parent_id) DO UPDATE SET ${field} = excluded.${field}
	`);
}

async function copyStockLinks(db: Database, parent: string) {
	const locales = sql.identifier(`${parent}_locales`);
	for (const [url, original, en, de] of stockMenu) {
		await db.run(sql`
			INSERT INTO ${locales} (_parent_id, _locale, label)
			SELECT id, ${otherLocales[0]}, ${en} FROM ${sql.identifier(parent)} WHERE url = ${url} AND label = ${original}
			UNION ALL
			SELECT id, ${otherLocales[1]}, ${de} FROM ${sql.identifier(parent)} WHERE url = ${url} AND label = ${original}
		`);
	}
}

function stockFooter(row: LegacyFooter, locale: (typeof otherLocales)[number]) {
	const title = row.heading === defaultHeading;
	const times = row.hours?.match(hoursPattern);
	const year = row.copyright?.match(yearPattern)?.[1];
	const stockCopyright =
		year && row.copyright === `© ${year}. ${row.company}. Все права защищены.`;
	const brand = row.company === "ПромФормаТех" ? "PromFormaTech" : row.company;
	if (locale === "de") {
		return [
			title ? "Kontakt" : null,
			times ? `Öffnungszeiten: ${times[1]}–${times[2]} Uhr` : null,
			stockCopyright ? `© ${year} ${brand}. Alle Rechte vorbehalten.` : null,
		] as const;
	}
	return [
		title ? "Contact" : null,
		times ? `Hours: ${times[1]}–${times[2]}` : null,
		stockCopyright ? `© ${year} ${brand}. All rights reserved.` : null,
	] as const;
}

async function moveFooter(db: Database, scope: Scope) {
	const { settings } = scope;
	const fields = footerFields(scope);
	const locales = sql.identifier(`${settings}_locales`);
	const parent = sql.identifier(settings);
	await createLocales(
		db,
		settings,
		"integer",
		fields.map(({ after }) => after),
		`${settings}_locales_locale_parent_id_unique`,
		`${settings}_locales_parent_id_idx`,
	);
	const input = fields.map(({ before }) => sql.identifier(before));
	const output = sql.join(
		fields.map(({ after }) => sql.identifier(after)),
		sql`, `,
	);
	const company = sql.identifier(
		scope.version ? "version_company_name" : "company_name",
	);
	await db.run(sql`
		INSERT INTO ${locales} (_parent_id, _locale, ${output})
		SELECT id, ${originalLocale}, ${sql.join(input, sql`, `)} FROM ${parent}
	`);
	const rows = await db.all<LegacyFooter>(sql`
		SELECT id, ${input[0]} AS heading, ${input[1]} AS hours, ${input[2]} AS copyright, ${company} AS company
		FROM ${parent}
	`);
	for (const row of rows) {
		for (const locale of otherLocales) {
			const [title, hours, copyright] = stockFooter(row, locale);
			if (title || hours || copyright) {
				await db.run(sql`
					INSERT INTO ${locales} (_parent_id, _locale, ${output})
					VALUES (${row.id}, ${locale}, ${title}, ${hours}, ${copyright})
				`);
			}
		}
	}
	for (const { before } of fields) {
		await db.run(
			sql`ALTER TABLE ${parent} DROP COLUMN ${sql.identifier(before)}`,
		);
	}
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
	for (const scope of scopes) {
		const offices = `${scope.rows}_locations`;
		await db.run(
			sql`ALTER TABLE ${sql.identifier(`${offices}_locales`)} ADD COLUMN title text`,
		);
		await copyRussian(db, offices, "title");
		await db.run(sql`ALTER TABLE ${sql.identifier(offices)} DROP COLUMN title`);
		for (const [index, { table, column }] of rowFields(scope).entries()) {
			await createLocales(
				db,
				table,
				scope.version ? "integer" : "text",
				[column],
				scope.indexes[index],
				index === 0
					? scope.peopleParentIndex
					: `${table}_locales_parent_id_idx`,
			);
			await copyRussian(db, table, column);
			if (column === "label") {
				await copyStockLinks(db, table);
			}
			await db.run(
				sql`ALTER TABLE ${sql.identifier(table)} DROP COLUMN ${sql.identifier(column)}`,
			);
		}
		await moveFooter(db, scope);
	}
}

async function restoreColumn(
	db: Database,
	table: string,
	before: string,
	after = before,
) {
	const parent = sql.identifier(table);
	const old = sql.identifier(before);
	const field = sql.identifier(after);
	await db.run(sql`ALTER TABLE ${parent} ADD COLUMN ${old} text`);
	await db.run(sql`
		UPDATE ${parent} AS parent SET ${old} = (
			SELECT ${field} FROM ${sql.identifier(`${table}_locales`)}
			WHERE _parent_id = parent.id AND ${field} IS NOT NULL
			ORDER BY _locale <> ${originalLocale}, _locale LIMIT 1
		)
	`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	for (const scope of scopes) {
		const offices = `${scope.rows}_locations`;
		await restoreColumn(db, offices, "title");
		await db.run(
			sql`ALTER TABLE ${sql.identifier(`${offices}_locales`)} DROP COLUMN title`,
		);
		for (const { table, column } of rowFields(scope)) {
			await restoreColumn(db, table, column);
			await db.run(sql`DROP TABLE ${sql.identifier(`${table}_locales`)}`);
		}
		for (const { before, after } of footerFields(scope)) {
			await restoreColumn(db, scope.settings, before, after);
		}
		await db.run(
			sql`DROP TABLE ${sql.identifier(`${scope.settings}_locales`)}`,
		);
	}
}
