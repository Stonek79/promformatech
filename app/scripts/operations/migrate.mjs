import { spawnSync } from "node:child_process";
import {
	getRuntimeConfig,
	isBuildPhase,
	PROCESS_ROLE,
	RUNTIME,
} from "../../src/config/runtime.ts";
import {
	connectDatabase,
	loadEnvironment,
	OperationError,
	operationLock,
	reportError,
	verifyMigrationLedger,
} from "./database.mjs";

async function main() {
	loadEnvironment();
	if (isBuildPhase()) {
		throw new OperationError("Build processes must not apply migrations");
	}
	const environment = {
		...process.env,
		NODE_ENV: RUNTIME.production,
		APP_PROCESS_ROLE: PROCESS_ROLE.migrator,
	};
	const runtime = getRuntimeConfig(environment);
	const client = await connectDatabase(runtime.databaseURL);
	try {
		await operationLock(client);
		await verifyMigrationLedger(client, { exact: false });
		const result = spawnSync("pnpm", ["exec", "payload", "migrate"], {
			env: environment,
			stdio: "inherit",
		});
		if (result.status !== 0) {
			throw new OperationError(
				"Migration process failed; application must remain stopped",
			);
		}
		await verifyMigrationLedger(client);
		console.log("Migration ledger verified");
	} finally {
		await client.end();
	}
}

await main().catch(reportError);
