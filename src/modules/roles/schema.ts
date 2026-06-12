import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "../users/schema";

export const roles = pgTable("roles", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	permissions: text("permissions").notNull().default("[]"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	roleId: uuid("role_id")
		.notNull()
		.references(() => roles.id, { onDelete: "cascade" }),
});

export const createRoleSchema = createInsertSchema(roles).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateRoleSchema = createRoleSchema.partial();

// SCHEMA MANUAL: Blinda o Fastify contra erros de serialização de data e undefined
export const responseRoleSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable().optional(),
	permissions: z.string(),
	// Permite que venha nulo, undefined ou data e força a virar string no JSON
	createdAt: z.coerce.string().optional(),
	updatedAt: z.coerce.string().optional(),
});
