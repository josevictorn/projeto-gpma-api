import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paymentMethods = pgTable("payment_methods", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull().unique(),
	description: text("description"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;

export const createPaymentMethodSchema = createInsertSchema(
	paymentMethods
).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

export const responsePaymentMethodSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable().optional(),
	is_active: z.boolean(),
	created_at: z.date(),
	updated_at: z.date(),
});
