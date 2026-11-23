import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-sqlite";
import type { Payload } from "payload";
import { migrations } from "@/migrations";
import { verifyLedger } from "./ledger";

export async function migrateDatabase(cms: Payload) {
	await verifyLedger(cms, false);
	await cms.db.migrate({
		migrations: migrations.map((migration) => ({
			...migration,
			// Payload's base adapter erases the provider-specific migration arguments.
			up: (args: unknown) => migration.up(args as MigrateUpArgs),
			down: (args: unknown) => migration.down(args as MigrateDownArgs),
		})),
	});
	await verifyLedger(cms);
}
