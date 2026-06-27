import { desc, eq } from "drizzle-orm";
import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import { type Case, cases } from "./schema";

export class CasesRepository extends DrizzleRepository<typeof cases> {
	async findByClientId(clientId: string): Promise<Case[]> {
		return db
			.select()
			.from(cases)
			.where(eq(cases.clientId, clientId))
			.orderBy(desc(cases.createdAt));
	}
}
