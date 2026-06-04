/**
 * Converte chaves camelCase para snake_case (para a API pública).
 * O usuário pode substituir por um presenter customizado.
 */
export type PresenterFn<TInput, TOutput = Record<string, unknown>> = (
	item: TInput
) => TOutput;

/**
 * Converte uma string de camelCase para snake_case.
 * @param str String a ser convertida
 * @returns String em snake_case
 * @example
 * camelToSnake("firstName"); // Resultado: "first_name"
 */
function camelToSnake(str: string): string {
	return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Converte um objeto com chaves em camelCase para snake_case.
 * @param item Objeto a ser convertido
 * @returns Objeto com chaves em snake_case
 * @example
 * const user = { id: 1, firstName: "John", email: "john@example.com" };
 * const userSnake = snakeCasePresenter(user);
 * // Resultado: { id: 1, first_name: "John", email: "john@example.com" }
 */
export function snakeCasePresenter<T extends Record<string, unknown>>(
	item: T
): Record<string, unknown> {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(item)) {
		result[camelToSnake(key)] = value;
	}

	return result;
}

/**
 * Cria um presenter que seleciona campos específicos.
 * @param fields Campos para selecionar
 * @returns Presenter
 * @example
 * const userPresenter = pickPresenter<User>(["id", "firstName", "email"]);
 * // Resultado: { id: 1, first_name: "John", email: "john@example.com" }
 */
export function pickPresenter<T extends Record<string, unknown>>(
	fields: (keyof T)[]
): PresenterFn<T> {
	return (item: T) => {
		const result: Record<string, unknown> = {};
		for (const field of fields) {
			const key = camelToSnake(field as string);
			result[key] = item[field];
		}
		return result;
	};
}
