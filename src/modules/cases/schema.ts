import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "../schemas";

export const caseStatusEnum = ["OPEN", "CLOSED", "PENDING"] as const;

export const cases = pgTable("cases", {
	id: uuid("id").defaultRandom().primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	status: text("status").notNull().default("OPEN"),
	clientId: uuid("client_id")
		.notNull()
		.references(() => clients.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type Case = typeof cases.$inferSelect;

export const createCaseSchema = createInsertSchema(cases).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateCaseSchema = createCaseSchema.partial();

export const responseCaseSchema = createCaseSchema
	.omit({ clientId: true })
	.extend({
		id: z.uuid(),
		client_id: z.uuid(),
		created_at: z.date(),
		updated_at: z.date(),
	});
