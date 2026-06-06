import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/env";
// biome-ignore lint/performance/noNamespaceImport: re-export of all schemas
import * as schema from "@/modules/schemas";

const pool = new Pool({
	connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool, { schema, casing: "snake_case" });
