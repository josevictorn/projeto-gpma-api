import type { IRepository } from "./base-repository";
import type { IUseCase } from "./base-use-case";
import { type Either, left, right } from "./either";
import { type AppError, InvalidPageError, NotFoundError } from "./errors";
import { buildMeta, type PaginationMeta } from "./pagination";

/**
 * Use Case genérico para criar uma nova entidade.
 * @param repository Repositório da entidade
 * @param resourceName Nome da entidade
 * @template TSelect Tipo da entidade
 * @template TInsert Tipo de inserção
 * @example
 * ```ts
 * const createUser = new CreateUseCase(userRepository, "User");
 *
 * const result = await createUser.execute({
 *   name: "John Doe",
 *   email: "john.doe@example.com"
 * });
 * ```
 */
export class CreateUseCase<TSelect, TInsert>
	implements IUseCase<TInsert, { item: TSelect }>
{
	constructor(
		protected readonly repository: IRepository<TSelect, TInsert>,
		protected readonly resourceName: string
	) {}

	async execute(data: TInsert): Promise<Either<null, { item: TSelect }>> {
		const item = await this.repository.create(data);

		return right({ item });
	}
}

/**
 * Use Case genérico para obter uma entidade existente.
 * @param repository Repositório da entidade
 * @param resourceName Nome da entidade
 * @template TSelect Tipo da entidade
 * @example
 * ```ts
 * const getUser = new GetUseCase(userRepository, "User");
 *
 * const result = await getUser.execute({ id: "123" });
 * ```
 */
export class GetUseCase<TSelect>
	implements IUseCase<{ id: string }, { item: TSelect }>
{
	constructor(
		protected readonly repository: IRepository<TSelect>,
		protected readonly resourceName: string
	) {}

	async execute(input: {
		id: string;
	}): Promise<Either<AppError, { item: TSelect }>> {
		const item = await this.repository.findById(input.id);

		if (!item) {
			return left(new NotFoundError(this.resourceName, input.id));
		}

		return right({ item });
	}
}

/**
 * Use Case genérico para editar uma entidade existente.
 * @param repository Repositório da entidade
 * @param resourceName Nome da entidade
 * @template TSelect Tipo da entidade
 * @example
 * ```ts
 * const editUser = new EditUseCase(userRepository, "User");
 *
 * const result = await editUser.execute({
 *   id: "123",
 *   data: { name: "Jane Doe" }
 * });
 * ```
 */
export class EditUseCase<TSelect>
	implements IUseCase<{ id: string; data: Partial<TSelect> }, { item: TSelect }>
{
	constructor(
		protected readonly repository: IRepository<TSelect>,
		protected readonly resourceName: string
	) {}

	async execute(input: {
		id: string;
		data: Partial<TSelect>;
	}): Promise<Either<AppError, { item: TSelect }>> {
		const existing = await this.repository.findById(input.id);

		if (!existing) {
			return left(new NotFoundError(this.resourceName, input.id));
		}

		const merged = { ...existing, ...input.data } as TSelect;
		const updated = await this.repository.save(merged);

		return right({ item: updated });
	}
}

/**
 * Use Case genérico para deletar uma entidade existente.
 * @param repository Repositório da entidade
 * @param resourceName Nome da entidade
 * @template TSelect Tipo da entidade
 * @example
 * ```ts
 * const deleteUser = new DeleteUseCase(userRepository, "User");
 *
 * const result = await deleteUser.execute({ id: "123" });
 * ```
 */
export class DeleteUseCase<TSelect> implements IUseCase<{ id: string }, null> {
	constructor(
		protected readonly repository: IRepository<TSelect>,
		protected readonly resourceName: string
	) {}

	async execute(input: { id: string }): Promise<Either<AppError, null>> {
		const existing = await this.repository.findById(input.id);

		if (!existing) {
			return left(new NotFoundError(this.resourceName, input.id));
		}

		await this.repository.delete(input.id);
		return right(null);
	}
}

/**
 * Use Case genérico para obter uma lista paginada de entidades.
 * @param repository Repositório da entidade
 * @param resourceName Nome da entidade
 * @template TSelect Tipo da entidade
 * @example
 * ```ts
 * const fetchUsers = new FetchUseCase(userRepository, "User");
 *
 * const result = await fetchUsers.execute({ page: 1 });
 * ```
 */
export class FetchUseCase<TSelect>
	implements
		IUseCase<{ page: number }, { items: TSelect[]; meta: PaginationMeta }>
{
	constructor(
		protected readonly repository: IRepository<TSelect>,
		protected readonly resourceName: string
	) {}

	async execute(input: {
		page: number;
	}): Promise<Either<AppError, { items: TSelect[]; meta: PaginationMeta }>> {
		if (input.page < 1) {
			return left(new InvalidPageError());
		}

		const result = await this.repository.findMany({ page: input.page });

		return right({
			items: result.items,
			meta: buildMeta(input.page, result.total),
		});
	}
}
