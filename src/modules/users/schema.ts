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

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid("id").primaryKey().defaultRandom(),
	token: text("token").notNull().unique(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetTokens.$inferInsert;
