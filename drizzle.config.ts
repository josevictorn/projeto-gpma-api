import { defineConfig } from "drizzle-kit";
import { env } from "@/env";

export default defineConfig({
	dialect: "postgresql",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
	out: "'./drizzle/migrations'",
	schema: "./src/modules/*/schema.ts",
	casing: "snake_case",
});
