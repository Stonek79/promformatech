import { mkdtemp } from "node:fs/promises";
import path from "node:path";
import { backup, DatabaseSync } from "node:sqlite";
import { MIGRATION_POLICY } from "@/config/migrations";
import initialSchema from "@/migrations/20261030_161831_initial.json";
import localizedSchema from "@/migrations/20261118_195013_localized_materials.json";

const LEGACY_NAME = "dev";
const LEGACY_BATCH = -1;
const LOCALIZED_MIGRATION = "20261118_195013_localized_materials";

function sorted(rows: readonly unknown[]) {
	return rows
		.map((row) => JSON.stringify(row))
		.sort()
		.join("\n");
}

type Schema = {
	readonly tables: Readonly<
		Record<
			string,
			{
				readonly columns: Readonly<
					Record<
						string,
						{
							readonly name: string;
							readonly type: string;
							readonly notNull: boolean;
							readonly primaryKey: boolean;
						}
					>
				>;
				readonly indexes: Readonly<
					Record<
						string,
						{
							readonly name: string;
							readonly columns: readonly string[];
							readonly isUnique: boolean;
						}
					>
				>;
				readonly foreignKeys: Readonly<
					Record<
						string,
						{
							readonly columnsFrom: readonly string[];
							readonly columnsTo: readonly string[];
							readonly tableTo: string;
							readonly onUpdate: string;
							readonly onDelete: string;
						}
					>
				>;
			}
		>
	>;
};

function schemaMatches(db: DatabaseSync, schema: Schema) {
	const tables = db.prepare(
		"SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
	);
	if (
		sorted(tables.all().map(({ name }) => name)) !==
		sorted(Object.keys(schema.tables))
	) {
		return false;
	}
	const columns = db.prepare(
		"SELECT name, lower(type) AS type, [notnull] AS required, pk FROM pragma_table_info(?)",
	);
	const indexes = db.prepare(
		"SELECT name, [unique] AS isUnique FROM pragma_index_list(?) WHERE origin = 'c'",
	);
	const indexColumns = db.prepare(
		"SELECT name FROM pragma_index_info(?) ORDER BY seqno",
	);
	const foreignKeys = db.prepare(
		"SELECT [from], [table], [to], lower(on_update) AS onUpdate, lower(on_delete) AS onDelete FROM pragma_foreign_key_list(?)",
	);
	return Object.entries(schema.tables).every(([name, table]) => {
		const expectedColumns = Object.values(table.columns).map((column) => [
			column.name,
			column.type,
			+column.notNull,
			+column.primaryKey,
		]);
		const actualColumns = columns
			.all(name)
			.map((column) => [column.name, column.type, column.required, column.pk]);
		const expectedIndexes = Object.values(table.indexes).map((index) => [
			index.name,
			+index.isUnique,
			index.columns,
		]);
		const actualIndexes = indexes
			.all(name)
			.map((index) => [
				index.name,
				index.isUnique,
				indexColumns.all(index.name).map((column) => column.name),
			]);
		const expectedKeys = Object.values(table.foreignKeys).flatMap((key) =>
			key.columnsFrom.map((column, index) => [
				column,
				key.tableTo,
				key.columnsTo[index],
				key.onUpdate,
				key.onDelete,
			]),
		);
		const actualKeys = foreignKeys
			.all(name)
			.map((key) => [key.from, key.table, key.to, key.onUpdate, key.onDelete]);
		return (
			sorted(expectedColumns) === sorted(actualColumns) &&
			sorted(expectedIndexes) === sorted(actualIndexes) &&
			sorted(expectedKeys) === sorted(actualKeys)
		);
	});
}

function replaceLegacyLedger(db: DatabaseSync, migrations: readonly string[]) {
	db.exec("BEGIN IMMEDIATE");
	try {
		db.prepare(
			"DELETE FROM payload_migrations WHERE name = ? AND batch = ?",
		).run(LEGACY_NAME, LEGACY_BATCH);
		const insert = db.prepare(
			"INSERT INTO payload_migrations (name, batch) VALUES (?, ?)",
		);
		for (const name of migrations) {
			insert.run(name, MIGRATION_POLICY.minimumBatch);
		}
		db.exec("COMMIT");
	} catch (error) {
		db.exec("ROLLBACK");
		throw error;
	}
}

export async function adoptLegacyDevDatabase(file: string) {
	const source = new DatabaseSync(file);
	try {
		const ledger = source.prepare(
			"SELECT name FROM sqlite_schema WHERE type = 'table' AND name = ?",
		);
		if (!ledger.get(MIGRATION_POLICY.ledgerTable)) {
			return;
		}
		const rows = source
			.prepare("SELECT name, batch FROM payload_migrations")
			.all();
		if (
			rows.length !== 1 ||
			rows[0].name !== LEGACY_NAME ||
			rows[0].batch !== LEGACY_BATCH
		) {
			return;
		}
		if (
			source.prepare("PRAGMA quick_check").get()?.quick_check !== "ok" ||
			source.prepare("PRAGMA foreign_key_check").get()
		) {
			throw new Error(
				"Не пройдена проверка целостности локальной SQLite-базы.",
			);
		}
		if (schemaMatches(source, localizedSchema)) {
			const count = MIGRATION_POLICY.required.indexOf(LOCALIZED_MIGRATION) + 1;
			replaceLegacyLedger(source, MIGRATION_POLICY.required.slice(0, count));
			return;
		}
		if (!schemaMatches(source, initialSchema)) {
			throw new Error(
				"Локальная SQLite-база отличается от исходной схемы. Автоматическое обновление остановлено.",
			);
		}
		const directory = await mkdtemp(
			path.join(path.dirname(file), "before-localization."),
		);
		const destination = path.join(directory, path.basename(file));
		await backup(source, destination);
		console.info(`Резервная копия локальной базы: ${destination}`);
		replaceLegacyLedger(source, [MIGRATION_POLICY.required[0]]);
	} finally {
		source.close();
	}
}
