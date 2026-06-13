import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leadStatusEnum = [
	"NEW",
	"CONTACTED",
	"QUALIFIED",
	"LOST",
	"COMPLETED",
] as const;

export const leads = pgTable("leads", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull(),
	phone: text("phone").notNull(),
	status: text("status").notNull().default("NEW"),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const createLeadSchema = createInsertSchema(leads).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateLeadSchema = createLeadSchema.partial();

export const responseLeadSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	email: z.string(),
	phone: z.string(),
	status: z.enum(leadStatusEnum),
	created_at: z.date(),
	updated_at: z.date(),
});
