import { MIGRATION_POLICY } from "@/config/migrations";
import { down, up } from "./20261030_161831_initial";
export const migrations = [{ up, down, name: MIGRATION_POLICY.required[0] }];
