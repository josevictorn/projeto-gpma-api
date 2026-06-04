import type { PaginatedResult, PaginationParams } from "./pagination";

/**
 * Interface genérica para qualquer repositório CRUD.
 * @template T Tipo da entidade
 * @template CreateInput Tipo de inserção
 * @example
 * ```ts
 * class UserRepository implements IRepository<User, CreateUserInput> {
 *   async create(data: CreateUserInput): Promise<User> {
 *     // Implementação
 *   }
 * }
 * ```
 */
export interface IRepository<T, CreateInput = Partial<T>> {
	create(data: CreateInput): Promise<T>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<T | null>;
	findMany(params: PaginationParams): Promise<PaginatedResult<T>>;
	save(data: T): Promise<T>;
}
