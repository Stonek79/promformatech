import type { MigrateUpArgs } from "@payloadcms/db-sqlite";
import { part1 } from "./initial/part-1";
import { part2 } from "./initial/part-2";
import { part3 } from "./initial/part-3";
import { part4 } from "./initial/part-4";
import { part5 } from "./initial/part-5";
import { part6 } from "./initial/part-6";
export async function up(args: MigrateUpArgs): Promise<void> {
	await part1(args);
	await part2(args);
	await part3(args);
	await part4(args);
	await part5(args);
	await part6(args);
}
export async function down(): Promise<void> {
	throw new Error(
		"Restore a verified backup into a separate directory instead of dropping the schema.",
	);
}
