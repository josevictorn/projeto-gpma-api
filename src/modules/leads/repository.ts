import { count, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { DrizzleRepository } from "@/core/drizzle-repository";
import type { PaginatedResult, PaginationParams } from "@/core/pagination";
import { leads } from "./schema";

export class LeadsRepository extends DrizzleRepository<typeof leads> {
	async findMany(params: PaginationParams): Promise<PaginatedResult<typeof leads.$inferSelect>> {
		const perPage = params.perPage ?? 20;
		const offset = (params.page - 1) * perPage;
		const search = params.search?.trim();
		const filter = search ? ilike(leads.name, `%${search}%`) : undefined;

		const [rows, [totalRow]] = await Promise.all([
			db.select()
				.from(leads)
				.where(filter)
				.limit(perPage)
				.offset(offset),
			db.select({ total: count() })
				.from(leads)
				.where(filter),
		]);

		return {
			items: rows as typeof leads.$inferSelect[],
			total: totalRow.total,
		};
	}
}
