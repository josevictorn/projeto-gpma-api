import type { InferInsertModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import type { IRepository } from "./base-repository";
import type { PaginatedResult, PaginationParams } from "./pagination";
import { DEFAULT_PER_PAGE } from "./pagination";

/**
 * Repositório genérico usando Drizzle ORM.
 * @template TTable Tipo da tabela Drizzle
 * @template TSelect Tipo da entidade selecionada
 * @template TInsert Tipo de inserção
 * @returns DrizzleRepository
 * @example
 * ```ts
 * const usersRepository = new DrizzleRepository(usersTable, usersTable.id);
 * ```
 */
export class DrizzleRepository<
	TTable extends PgTable,
	TSelect = TTable["$inferSelect"],
	TInsert = TTable["$inferInsert"],
> implements IRepository<TSelect, TInsert>
{
	constructor(
		protected readonly table: TTable,
		protected readonly pkColumn: PgColumn
	) {}

	async create(data: TInsert): Promise<TSelect> {
		const [row] = await db
			.insert(this.table)
			.values(data as InferInsertModel<TTable>)
			.returning();

		return row as TSelect;
	}

	async delete(id: string): Promise<void> {
		await db.delete(this.table).where(eq(this.pkColumn, id));
	}

	async findById(id: string): Promise<TSelect | null> {
		const table = this.table as PgTable;

		const [row] = await db
			.select()
			.from(table)
			.where(eq(this.pkColumn, id))
			.limit(1);

		return (row as TSelect) ?? null;
	}

	async findMany(params: PaginationParams): Promise<PaginatedResult<TSelect>> {
		const perPage = params.perPage ?? DEFAULT_PER_PAGE;
		const offset = (params.page - 1) * perPage;
		const table = this.table as PgTable;

		const [rows, [totalRow]] = await Promise.all([
			db.select().from(table).limit(perPage).offset(offset),
			db.select({ total: count() }).from(table),
		]);

		return {
			items: rows as TSelect[],
			total: totalRow.total,
		};
	}

	async save(data: TSelect): Promise<TSelect> {
		const record = data as Record<string, unknown>;
		const pkValue = record[this.pkColumn.name] as string;
		const table = this.table as PgTable;

		const rows = await db
			.update(table)
			.set(record)
			.where(eq(this.pkColumn, pkValue))
			.returning();

		const row = (rows as TSelect[])[0];

		return row as TSelect;
	}
}
