import {
	type MigrateDownArgs,
	type MigrateUpArgs,
	sql,
} from "@payloadcms/db-sqlite";

const office = {
	address: "г. Москва, ул. Маршала Соколовского, д. 3, этаж 4",
	en: "3 Marshala Sokolovskogo Street, 4th floor, Moscow",
	de: "Marschala-Sokolowskogo-Straße 3, 4. Stock, Moskau",
	url: "https://www.openstreetmap.org/?mlat=55.79323&mlon=37.48931#map=17/55.79323/37.48931",
	preview: "/maps/moscow-office.webp",
} as const;

const contactTables = [
	{
		settings: "site_settings",
		formerAddress: "address",
		locations: "site_settings_locations",
		rowKey: "id",
		parentType: sql`text`,
		localeIndex: "site_settings_locations_locales_locale_parent_id_unique",
	},
	{
		settings: "_site_settings_v",
		formerAddress: "version_address",
		locations: "_site_settings_v_version_locations",
		rowKey: "_uuid",
		parentType: sql`integer`,
		localeIndex: "_site_settings_v_version_locations_locales_locale_parent_id_",
	},
] as const;

const versionTables = [
	"_pages_v",
	"_products_v",
	"_services_v",
	"_projects_v",
	"_media_v",
	"_site_settings_v",
] as const;

function names(entry: (typeof contactTables)[number]) {
	return {
		settings: sql.identifier(entry.settings),
		address: sql.identifier(entry.formerAddress),
		locations: sql.identifier(entry.locations),
		locales: sql.identifier(`${entry.locations}_locales`),
	};
}

async function moveAddresses(
	db: MigrateUpArgs["db"],
	entry: (typeof contactTables)[number],
) {
	const { settings, address, locations, locales } = names(entry);
	await db.run(
		sql`ALTER TABLE ${locations} ADD COLUMN show_in_footer integer DEFAULT false`,
	);
	await db.run(
		sql`ALTER TABLE ${locations} ADD COLUMN map_existing_preview text`,
	);
	await db.run(sql`
		CREATE TABLE ${locales} (
			address text,
			id integer PRIMARY KEY NOT NULL,
			_locale text NOT NULL,
			_parent_id ${entry.parentType} NOT NULL,
			FOREIGN KEY (_parent_id) REFERENCES ${locations}(id) ON UPDATE NO ACTION ON DELETE CASCADE
		)
	`);
	await db.run(
		sql`CREATE UNIQUE INDEX ${sql.identifier(entry.localeIndex)} ON ${locales} (_locale, _parent_id)`,
	);
	await db.run(
		sql`CREATE INDEX ${sql.identifier(`${entry.locations}_locales_parent_id_idx`)} ON ${locales} (_parent_id)`,
	);

	// Preserve a separately configured footer address even if no office had that address.
	await db.run(sql`
		INSERT INTO ${locations} (_parent_id, _order, title, address, ${sql.identifier(entry.rowKey)})
		SELECT current.id,
			COALESCE((SELECT max(loc._order) FROM ${locations} AS loc WHERE loc._parent_id = current.id), 0) + 1,
			${"Основной офис"}, current.${address}, lower(hex(randomblob(12)))
		FROM ${settings} AS current
		WHERE trim(coalesce(current.${address}, '')) <> ''
			AND NOT EXISTS (
				SELECT 1 FROM ${locations} AS loc
				WHERE loc._parent_id = current.id AND trim(loc.address) = trim(current.${address})
			)
	`);
	await db.run(sql`
		UPDATE ${locations} SET show_in_footer = true
		WHERE id IN (
			SELECT (
				SELECT loc.id FROM ${locations} AS loc
				WHERE loc._parent_id = current.id AND trim(loc.address) = trim(current.${address})
				ORDER BY loc._order, loc.id LIMIT 1
			)
			FROM ${settings} AS current WHERE trim(coalesce(current.${address}, '')) <> ''
		)
	`);
	await db.run(sql`
		UPDATE ${locations}
		SET map_url = coalesce(nullif(trim(map_url), ''), ${office.url}),
			map_existing_preview = ${office.preview}
		WHERE trim(address) = ${office.address}
	`);
	await db.run(sql`
		INSERT INTO ${locales} (_parent_id, _locale, address)
		SELECT id, 'ru', address FROM ${locations} WHERE address IS NOT NULL
		UNION ALL
		SELECT id, 'en', ${office.en} FROM ${locations} WHERE trim(address) = ${office.address}
		UNION ALL
		SELECT id, 'de', ${office.de} FROM ${locations} WHERE trim(address) = ${office.address}
	`);
	await db.run(sql`ALTER TABLE ${locations} DROP COLUMN address`);
	await db.run(sql`ALTER TABLE ${settings} DROP COLUMN ${address}`);
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
	for (const table of versionTables) {
		const version = sql.identifier(table);
		await db.run(sql`ALTER TABLE ${version} ADD COLUMN snapshot integer`);
		await db.run(sql`ALTER TABLE ${version} ADD COLUMN published_locale text`);
		await db.run(
			sql`CREATE INDEX ${sql.identifier(`${table}_snapshot_idx`)} ON ${version} (snapshot)`,
		);
		await db.run(
			sql`CREATE INDEX ${sql.identifier(`${table}_published_locale_idx`)} ON ${version} (published_locale)`,
		);
	}
	for (const entry of contactTables) {
		await moveAddresses(db, entry);
	}
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
	for (const entry of contactTables) {
		const { settings, address, locations, locales } = names(entry);
		await db.run(sql`ALTER TABLE ${locations} ADD COLUMN address text`);
		await db.run(sql`
			UPDATE ${locations} AS loc SET address = (
				SELECT translation.address FROM ${locales} AS translation
				WHERE translation._parent_id = loc.id AND trim(coalesce(translation.address, '')) <> ''
				ORDER BY translation._locale <> 'ru', translation._locale LIMIT 1
			)
		`);
		await db.run(sql`ALTER TABLE ${settings} ADD COLUMN ${address} text`);
		await db.run(sql`
			UPDATE ${settings} AS current SET ${address} = (
				SELECT loc.address FROM ${locations} AS loc
				WHERE loc._parent_id = current.id AND loc.show_in_footer
				ORDER BY loc._order, loc.id LIMIT 1
			)
		`);
		await db.run(sql`DROP TABLE ${locales}`);
		await db.run(sql`ALTER TABLE ${locations} DROP COLUMN show_in_footer`);
		await db.run(
			sql`ALTER TABLE ${locations} DROP COLUMN map_existing_preview`,
		);
	}
	for (const table of versionTables) {
		const version = sql.identifier(table);
		await db.run(sql`DROP INDEX ${sql.identifier(`${table}_snapshot_idx`)}`);
		await db.run(
			sql`DROP INDEX ${sql.identifier(`${table}_published_locale_idx`)}`,
		);
		await db.run(sql`ALTER TABLE ${version} DROP COLUMN snapshot`);
		await db.run(sql`ALTER TABLE ${version} DROP COLUMN published_locale`);
	}
}
