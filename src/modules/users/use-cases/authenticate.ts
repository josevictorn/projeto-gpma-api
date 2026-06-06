import { verify } from "argon2";
import type { IUseCase } from "@/core/base-use-case";
import { type Either, left, right } from "@/core/either";
import { UnauthorizedError } from "@/core/errors";
import type { UsersRepository } from "../repository";
import type { User } from "../schema";

interface AuthenticateUseCaseRequest {
	email: string;
	password: string;
}

type AuthenticateUseCaseResponse = Either<UnauthorizedError, { user: User }>;

export class AuthenticateUseCase
	implements IUseCase<AuthenticateUseCaseRequest, { user: User }>
{
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute(
		input: AuthenticateUseCaseRequest
	): Promise<AuthenticateUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(input.email);

		if (!user) {
			return left(new UnauthorizedError("Invalid email or password"));
		}

		const isValid = await verify(user.passwordHash, input.password);

		if (!isValid) {
			return left(new UnauthorizedError("Invalid credentials."));
		}

		return right({ user });
	}
}
