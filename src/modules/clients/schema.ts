import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const clients = pgTable("clients", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	phone: text("phone").notNull(),
	maritalStatus: text("marital_status").notNull(),
	profession: text("profession").notNull(),
	cpf: text("cpf").notNull().unique(),
	rg: text("rg").notNull().unique(),
	issuingAgency: text("issuing_agency").notNull(),
	street: text("street").notNull(),
	number: text("number").notNull(),
	neighborhood: text("neighborhood").notNull(),
	city: text("city").notNull(),
	state: text("state").notNull(),
	zipCode: text("zip_code").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at")
		.defaultNow()
		.$onUpdate(() => new Date()),
});

export const createClientSchema = createInsertSchema(clients).omit({
	id: true,
	createdAt: true,
	updatedAt: true,
});

export const updateClientSchema = createClientSchema.partial();

export const responseClientSchema = createClientSchema
	.omit({
		zipCode: true,
		issuingAgency: true,
		maritalStatus: true,
	})
	.extend({
		id: z.uuid(),
		zip_code: z.string(),
		issuing_agency: z.string(),
		marital_status: z.string(),
		created_at: z.date(),
		updated_at: z.date(),
	});
