import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z.enum(["dev", "test", "production"]).default("dev"),
	PORT: z.coerce.number().default(3333),
	JWT_SECRET: z.string(),
	DATABASE_URL: z.url(),
	DATABASE_SCHEMA: z.string().default("public"),
	SMTP_HOST: z.string(),
	SMTP_PORT: z.coerce.number().default(587),
	SMTP_USER: z.string(),
	SMTP_PASS: z.string(),
	SMTP_FROM: z.string().default("Vero <no-reply@vero.com>"),
	WEB_URL: z.string().url().default("http://localhost:5173"),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
	console.error("❌ Invalid environment variables", z.flattenError(_env.error));

	throw new Error("Invalid environment variables.");
}

export const env = _env.data;
