import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import { count, eq } from "drizzle-orm";
import type { cases } from "./schema";

export class CasesRepository extends DrizzleRepository<typeof cases> {
	async findManyByClientId(params: { page: number; clientId: string }) {
		const perPage = params.page ? params.page : 1;
		const offset = (params.page - 1) * 10;

		const table = this.table as typeof cases;

		const [rows, [totalRow]] = await Promise.all([
			db.select().from(table).where(eq(table.clientId, params.clientId)).limit(10).offset(offset),
			db.select({ total: count() }).from(table).where(eq(table.clientId, params.clientId)),
		]);

		return { items: rows as unknown as any[], total: totalRow.total };
	}
}
