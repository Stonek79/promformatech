import { type MigrateUpArgs, sql } from "@payloadcms/db-sqlite";

const originalLocale = "ru";

const textFields: Readonly<Record<string, readonly string[]>> = {
	hero: ["heading", "text", "buttonLabel"],
	text: ["heading", "body"],
	textImage: ["heading", "body"],
	cards: ["heading"],
	steps: ["heading"],
	gallery: ["heading"],
	video: ["heading", "caption"],
	specifications: ["heading"],
	callToAction: ["heading", "text", "buttonLabel"],
};
const nestedFields = {
	steps: { array: "items", fields: ["title", "text", "duration"] },
	gallery: { array: "gallery", fields: ["caption"] },
	specifications: { array: "items", fields: ["label", "value"] },
} as const;

type Database = MigrateUpArgs["db"];
type Convert = (value: unknown) => unknown;

function isRow(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function convertFields(
	row: Record<string, unknown>,
	names: readonly string[],
	convert: Convert,
) {
	for (const name of names) {
		if (Object.hasOwn(row, name)) {
			row[name] = convert(row[name]);
		}
	}
}

function convertBlocks(raw: string, convert: Convert) {
	const blocks: unknown = JSON.parse(raw);
	if (!Array.isArray(blocks)) {
		return raw;
	}
	for (const block of blocks) {
		if (!isRow(block) || typeof block.blockType !== "string") {
			continue;
		}
		const kind = block.blockType;
		if (Object.hasOwn(textFields, kind)) {
			convertFields(block, textFields[kind], convert);
		}
		if (Object.hasOwn(nestedFields, kind)) {
			const { array, fields } = nestedFields[kind as keyof typeof nestedFields];
			const rows = block[array];
			if (Array.isArray(rows)) {
				for (const row of rows) {
					if (isRow(row)) {
						convertFields(row, fields, convert);
					}
				}
			}
		}
	}
	return JSON.stringify(blocks);
}

async function migrateBlocks(
	db: Database,
	tableName: string,
	columnName: string,
	convert: Convert,
) {
	const table = sql.identifier(tableName);
	const column = sql.identifier(columnName);
	const rows = await db.all<{ id: number; blocks: string }>(
		sql`SELECT id, ${column} AS blocks FROM ${table} WHERE ${column} IS NOT NULL`,
	);
	for (const row of rows) {
		const value = convertBlocks(row.blocks, convert);
		await db.run(
			sql`UPDATE ${table} SET ${column} = ${value} WHERE id = ${row.id}`,
		);
	}
}

export function storeRussianBlocks(
	db: Database,
	table: string,
	column: string,
) {
	return migrateBlocks(db, table, column, (value) => ({
		[originalLocale]: value,
	}));
}

export function restoreRussianBlocks(
	db: Database,
	table: string,
	column: string,
) {
	return migrateBlocks(db, table, column, (value) =>
		isRow(value) ? value[originalLocale] : value,
	);
}
