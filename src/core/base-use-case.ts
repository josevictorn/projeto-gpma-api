import type { Either } from "./either";
import type { AppError } from "./errors";

/**
 * Contrato base para qualquer Use Case.
 * @template Input Tipo de entrada
 * @template Output Tipo de saída
 * @example
 * ```ts
 * class CreateUserUseCase implements IUseCase<CreateUserInput, User> {
 *   async execute(input: CreateUserInput): Promise<Either<AppError | null, User>> {
 *     // Implementação
 *   }
 * }
 * ```
 */
export interface IUseCase<Input, Output> {
	execute(input: Input): Promise<Either<AppError | null, Output>>;
}
