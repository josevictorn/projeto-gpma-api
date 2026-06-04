export class Left<L, R> {
	readonly value: L;

	constructor(value: L) {
		this.value = value;
	}

	isRight(): this is Right<L, R> {
		return false;
	}

	isLeft(): this is Left<L, R> {
		return true;
	}
}

export class Right<L, R> {
	readonly value: R;

	constructor(value: R) {
		this.value = value;
	}

	isRight(): this is Right<L, R> {
		return true;
	}

	isLeft(): this is Left<L, R> {
		return false;
	}
}

/**
 * Tipo Either para retornar sucesso ou erro.
 * @template L Tipo do erro
 * @template R Tipo do sucesso
 */
export type Either<L, R> = Left<L, R> | Right<L, R>;

/**
 * Cria um Either Left.
 * @template L Tipo do erro
 * @template R Tipo do sucesso
 * @param value Valor do erro
 * @returns Either Left
 */
export const left = <L, R>(value: L): Either<L, R> => new Left(value);

/**
 * Cria um Either Right.
 * @template L Tipo do erro
 * @template R Tipo do sucesso
 * @param value Valor do sucesso
 * @returns Either Right
 */
export const right = <L, R>(value: R): Either<L, R> => new Right(value);
