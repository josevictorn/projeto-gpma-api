import { hash } from "argon2";
import type { IUseCase } from "@/core/base-use-case";
import { type Either, left, right } from "@/core/either";
import { ConflictError } from "@/core/errors";
import type { UsersRepository } from "../repository";
import type { roleEnum, User } from "../schema";

interface RegisterUserUseCaseRequest {
	email: string;
	name: string;
	password: string;
	role?: (typeof roleEnum.enumValues)[number];
}

type RegisterUserUseCaseResponse = Either<ConflictError, { user: User }>;

export class RegisterUseCase
	implements IUseCase<RegisterUserUseCaseRequest, { user: User }>
{
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute(
		input: RegisterUserUseCaseRequest
	): Promise<RegisterUserUseCaseResponse> {
		const existing = await this.usersRepository.findByEmail(input.email);

		if (existing) {
			return left(new ConflictError("User", "email", input.email));
		}

		const passwordHash = await hash(input.password);

		const user = await this.usersRepository.create({
			name: input.name,
			email: input.email,
			passwordHash,
			role: input.role,
		});

		return right({ user });
	}
}
