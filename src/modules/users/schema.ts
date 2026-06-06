import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["ADMIN", "LAWYER", "CLIENT"]);

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: roleEnum("role").default("CLIENT").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const createUserSchema = z.object({
	name: z.string().min(2),
	email: z.email(),
	password: z.string().min(6),
	role: z.enum(["ADMIN", "LAWYER", "CLIENT"]).optional(),
});

export const editUserSchema = z.object({
	name: z.string().min(2).optional(),
	email: z.email().optional(),
	role: z.enum(["ADMIN", "LAWYER", "CLIENT"]).optional(),
});

export const userResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	email: z.email(),
	role: z.string(),
	created_at: z.date(),
});
