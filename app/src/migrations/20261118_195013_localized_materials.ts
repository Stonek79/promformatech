import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-sqlite";
import {
	restoreRussianBlocks,
	storeRussianBlocks,
} from "./localization/blocks";

const ORIGINAL_LOCALE = "ru";
const INDEX_NAME_LIMIT = 60;
const COMMON_FIELDS = [
	"title",
	"summary",
	"seo_title",
	"seo_description",
] as const;
const COLLECTIONS = {
	products: { fields: ["category"], rows: ["gallery", "specifications"] },
	services: { fields: [], rows: ["gallery"] },
	projects: {
		fields: ["task", "solution", "result", "client", "location"],
		rows: ["gallery"],
	},
} as const;
const ROW_FIELDS = {
	gallery: ["caption"],
	specifications: ["label", "value"],
} as const;

type Database = MigrateUpArgs["db"];
type LocaleTable = {
	readonly name: string;
	readonly columns: readonly string[];
	readonly parentType: "integer" | "text";
};

function materialSchemas() {
	return Object.entries(COLLECTIONS).flatMap(
		([collection, { fields, rows }]) => {
			const columns = [...COMMON_FIELDS, ...fields];
			return (
				[
					{
						name: collection,
						prefix: "",
						rows: collection,
						parentType: "text",
					},
					{
						name: `_${collection}_v`,
						prefix: "version_",
						rows: `_${collection}_v_version`,
						parentType: "integer",
					},
				] as const
			).map((scope) => ({
				document: {
					name: scope.name,
					columns: columns.map((name) => scope.prefix + name),
					parentType: "integer" as const,
				},
				blocks: `${scope.prefix}blocks`,
				rows: rows.map((row) => ({
					name: `${scope.rows}_${row}`,
					columns: ROW_FIELDS[row],
					parentType: scope.parentType,
				})),
			}));
		},
	);
}

async function moveColumns(
	db: Database,
	{ name, columns, parentType }: LocaleTable,
) {
	const parent = sql.identifier(name);
	const localeName = `${name}_locales`;
	const locales = sql.identifier(localeName);
	const fields = columns.map((column) => sql.identifier(column));
	const list = sql.join(fields, sql`, `);
	const definitions = sql.join(
		fields.map((field) => sql`${field} text`),
		sql`, `,
	);
	await db.run(sql`
		CREATE TABLE ${locales} (
			${definitions}, id integer PRIMARY KEY NOT NULL, _locale text NOT NULL,
			_parent_id ${sql.raw(parentType)} NOT NULL,
			FOREIGN KEY (_parent_id) REFERENCES ${parent}(id) ON DELETE CASCADE
		)
	`);
	const localeIndex = `${localeName}_locale_parent_id_unique`.slice(
		0,
		INDEX_NAME_LIMIT,
	);
	await db.run(
		sql`CREATE UNIQUE INDEX ${sql.identifier(localeIndex)} ON ${locales} (_locale, _parent_id)`,
	);
	await db.run(
		sql`CREATE INDEX ${sql.identifier(`${localeName}_parent_id_idx`)} ON ${locales} (_parent_id)`,
	);
	await db.run(
		sql`INSERT INTO ${locales} (_parent_id, _locale, ${list}) SELECT id, ${ORIGINAL_LOCALE}, ${list} FROM ${parent}`,
	);
	for (const field of fields) {
		await db.run(sql`ALTER TABLE ${parent} DROP COLUMN ${field}`);
	}
}

async function restoreColumns(db: Database, { name, columns }: LocaleTable) {
	const parent = sql.identifier(name);
	const locales = sql.identifier(`${name}_locales`);
	for (const column of columns) {
		const field = sql.identifier(column);
		await db.run(sql`ALTER TABLE ${parent} ADD COLUMN ${field} text`);
		await db.run(sql`
			UPDATE ${parent} AS parent SET ${field} = (
				SELECT ${field} FROM ${locales}
				WHERE _parent_id = parent.id AND _locale = ${ORIGINAL_LOCALE}
			)
		`);
	}
	await db.run(sql`DROP TABLE ${locales}`);
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
	for (const { document, blocks, rows } of materialSchemas()) {
		await moveColumns(db, document);
		await storeRussianBlocks(db, document.name, blocks);
		for (const row of rows) {
			await moveColumns(db, row);
		}
	}
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	for (const { document, blocks, rows } of materialSchemas()) {
		for (const row of rows) {
			await restoreColumns(db, row);
		}
		await restoreColumns(db, document);
		await restoreRussianBlocks(db, document.name, blocks);
	}
}
