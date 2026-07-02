import { count, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { DrizzleRepository } from "@/core/drizzle-repository";
import type { PaginatedResult, PaginationParams } from "@/core/pagination";
import { clients } from "./schema";

export class ClientsRepository extends DrizzleRepository<typeof clients> {
	async findMany(params: PaginationParams): Promise<PaginatedResult<typeof clients.$inferSelect>> {
		const perPage = params.perPage ?? 20;
		const offset = (params.page - 1) * perPage;
		const search = params.search?.trim();
		const filter = search
			? or(
				ilike(clients.name, `%${search}%`),
				ilike(clients.cpf, `%${search}%`)
			)
			: undefined;

		const [rows, [totalRow]] = await Promise.all([
			db.select()
				.from(clients)
				.where(filter)
				.limit(perPage)
				.offset(offset),
			db.select({ total: count() })
				.from(clients)
				.where(filter),
		]);

		return {
			items: rows as typeof clients.$inferSelect[],
			total: totalRow.total,
		};
	}
}
