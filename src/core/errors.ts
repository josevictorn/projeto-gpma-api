import { DatabaseError } from "pg";

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

/**
 * Erro de violação de constraint de unicidade do PostgreSQL (code 23505).
 * Retornado como 409 Conflict quando um valor único (email, cpf, rg, etc.)
 * já existe no banco.
 * @param message Mensagem amigável (opcional)
 * @return UniqueConstraintError
 */
export class UniqueConstraintError extends AppError {
	readonly statusCode = 409;

	constructor(message = "Registro já cadastrado.") {
		super(message);
	}
}

/** Código SQLSTATE do PostgreSQL para violação de unicidade. */
const PG_UNIQUE_VIOLATION = "23505";

/** Rótulos amigáveis (PT-BR) para os campos únicos conhecidos. */
const UNIQUE_FIELD_LABELS: Record<string, string> = {
	email: "E-mail",
	cpf: "CPF",
	rg: "RG",
};

/**
 * Extrai a coluna do `detail` do Postgres, ex: `Key (email)=(...) already exists.`
 * Independente de idioma (o `lc_messages` pode estar em PT-BR: `Chave (email)=(...)`).
 */
const PG_DETAIL_KEY_REGEX = /\(([^)]+)\)=\(/;

/** Sufixo das constraints únicas geradas pelo Drizzle (`<tabela>_<coluna>_unique`). */
const UNIQUE_CONSTRAINT_SUFFIX_REGEX = /_unique$/;

/**
 * Extrai o nome da coluna que violou a constraint única.
 * Tenta primeiro o `detail` (ex: `Key (email)=(...) already exists.`),
 * caindo para o nome da constraint (`<tabela>_<coluna>_unique`).
 */
function extractUniqueField(error: DatabaseError): string | null {
	const detailMatch = error.detail?.match(PG_DETAIL_KEY_REGEX);
	if (detailMatch) {
		return detailMatch[1].split(", ")[0];
	}

	const { constraint, table } = error;
	if (!constraint) {
		return null;
	}

	let name = constraint;
	if (table && name.startsWith(`${table}_`)) {
		name = name.slice(table.length + 1);
	}
	name = name.replace(UNIQUE_CONSTRAINT_SUFFIX_REGEX, "");

	return name || null;
}

/**
 * Localiza o `DatabaseError` do pg dentro do erro recebido. O Drizzle envolve os
 * erros do driver em um `DrizzleQueryError`, expondo o erro original em `cause`,
 * então percorremos a cadeia de `cause` até encontrar o `DatabaseError`.
 */
function findDatabaseError(error: unknown): DatabaseError | null {
	let current = error;
	while (current) {
		if (current instanceof DatabaseError) {
			return current;
		}
		current = (current as { cause?: unknown }).cause;
	}
	return null;
}

/**
 * Converte uma violação de unicidade do PostgreSQL em um `UniqueConstraintError`
 * com mensagem amigável. Retorna `null` se o erro não for desse tipo.
 *
 * Centraliza o tratamento para todos os módulos com colunas únicas, evitando
 * que o erro caia no handler genérico (500).
 * @example
 * const conflict = mapUniqueViolation(error);
 * if (conflict) return reply.status(conflict.statusCode).send({ message: conflict.message });
 */
export function mapUniqueViolation(
	error: unknown
): UniqueConstraintError | null {
	const dbError = findDatabaseError(error);
	if (!dbError || dbError.code !== PG_UNIQUE_VIOLATION) {
		return null;
	}

	const field = extractUniqueField(dbError);
	if (!field) {
		return new UniqueConstraintError();
	}

	const label = UNIQUE_FIELD_LABELS[field] ?? field;
	return new UniqueConstraintError(`${label} já cadastrado.`);
}
