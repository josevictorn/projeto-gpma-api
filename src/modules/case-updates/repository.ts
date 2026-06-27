import { asc, eq } from "drizzle-orm";
import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import { type CaseUpdate, caseUpdates } from "./schema";

export class CaseUpdatesRepository extends DrizzleRepository<
	typeof caseUpdates
> {
	async findByCaseId(caseId: string): Promise<CaseUpdate[]> {
		return db
			.select()
			.from(caseUpdates)
			.where(eq(caseUpdates.caseId, caseId))
			.orderBy(asc(caseUpdates.date));
	}
}
