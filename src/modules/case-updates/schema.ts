import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { cases } from "../schemas";

export const caseUpdates = pgTable("case_updates", {
	id: uuid("id").defaultRandom().primaryKey(),
	caseId: uuid("case_id")
		.notNull()
		.references(() => cases.id, { onDelete: "cascade" }),
	date: timestamp("date").notNull(),
	type: text("type").notNull(),
	description: text("description").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export type CaseUpdate = typeof caseUpdates.$inferSelect;

export const createCaseUpdateSchema = createInsertSchema(caseUpdates).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateCaseUpdateSchema = createCaseUpdateSchema.partial();

export const responseCaseUpdateSchema = createCaseUpdateSchema
	.omit({ caseId: true })
	.extend({
		id: z.uuid(),
		case_id: z.uuid(),
		created_at: z.date(),
		updated_at: z.date(),
	});
