import { expect, it } from "vitest";
import { MIGRATION_POLICY } from "@/config/migrations";
import { migrationsMatch } from "@/features/health/readiness";

it("requires the exact release migration set in a committed production batch", () => {
	const applied = MIGRATION_POLICY.required.map((name) => ({ name, batch: 1 }));
	expect(migrationsMatch(applied)).toBe(true);
	expect(migrationsMatch(applied.map((row) => ({ ...row, batch: "1" })))).toBe(
		true,
	);
	expect(migrationsMatch(applied.map((row) => ({ ...row, batch: 1.5 })))).toBe(
		false,
	);
	expect(migrationsMatch(applied.map((row) => ({ ...row, batch: null })))).toBe(
		false,
	);
	expect(migrationsMatch([])).toBe(false);
	expect(migrationsMatch([...applied, { name: "dev", batch: -1 }])).toBe(false);
	expect(migrationsMatch(applied.map((row) => ({ ...row, batch: -1 })))).toBe(
		false,
	);
	expect(
		migrationsMatch([
			...applied,
			{ name: "unknown_future_migration", batch: 2 },
		]),
	).toBe(false);
});
