/**
 * Erro genérico que pode ser lançado pelo UseCase.
 * Deve ser capturado pelo Controller e retornado como resposta HTTP.
 */
export abstract class AppError extends Error {
	abstract readonly statusCode: number;

	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * Erro de recurso não encontrado.
 * Exemplo: "User with id "123" not found."
 * @param resource Nome do recurso (ex: "User")
 * @param identifier Identificador do recurso (ex: "id "123"")
 * @return NotFoundError
 * @example new NotFoundError("User", "id "123"")
 */
export class NotFoundError extends AppError {
	readonly statusCode = 404;

	constructor(resource: string, identifier: string) {
		super(`${resource} "${identifier}" not found.`);
	}
}

/**
 * Erro de conflito, quando um recurso já existe.
 * Exemplo: "User with email "john@example.com" already exists."
 * @param resource Nome do recurso (ex: "User")
 * @param field Campo do recurso (ex: "email")
 * @param value Valor do campo (ex: "john@example.com")
 * @return ConflictError
 * @example new ConflictError("User", "email", "john@example.com")
 */
export class ConflictError extends AppError {
	readonly statusCode = 409;

	constructor(resource: string, field: string, value: string) {
		super(`${resource} with ${field} "${value}" already exists.`);
	}
}

/**
 * Erro de validação, quando os dados de entrada são inválidos.
 * Exemplo: "Validation failed: "email" must be a valid email address."
 * @param message Mensagem de erro detalhada (opcional)
 * @return ValidationError
 * @example new ValidationError("Validation failed: "email" must be a valid email address.")
 */
export class ValidationError extends AppError {
	readonly statusCode = 400;

	constructor(message = "Validation failed.") {
		super(message);
	}
}

/**
 * Erro de autenticação, quando o usuário não está autenticado.
 * Exemplo: "Unauthorized."
 * @param message Mensagem de erro detalhada (opcional)
 * @return UnauthorizedError
 * @example new UnauthorizedError("Unauthorized.")
 */
export class UnauthorizedError extends AppError {
	readonly statusCode = 401;

	constructor(message = "Unauthorized.") {
		super(message);
	}
}

/**
 * Erro de autorização, quando o usuário não tem permissão para acessar um recurso.
 * Exemplo: "Forbidden."
 * @param message Mensagem de erro detalhada (opcional)
 * @return ForbiddenError
 * @example new ForbiddenError("Forbidden.")
 */
export class ForbiddenError extends AppError {
	readonly statusCode = 403;

	constructor(message = "Forbidden.") {
		super(message);
	}
}

/**
 * Erro de página inválida, quando o número da página é menor ou igual a 0.
 * Exemplo: "Page number must be greater than 0."
 * @return InvalidPageError
 * @example new InvalidPageError()
 */
export class InvalidPageError extends ValidationError {
	constructor() {
		super("Page number must be greater than 0.");
	}
}
