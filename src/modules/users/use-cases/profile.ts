import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";
import type { UsersRepository } from "../repository";
import type { User } from "../schema";

interface ProfileUseCaseRequest {
	userId: string;
}

type ProfileUseCaseResponse = Either<NotFoundError, { user: User }>;

export class ProfileUseCase {
	constructor(private readonly usersRepository: UsersRepository) {}

	async execute(input: ProfileUseCaseRequest): Promise<ProfileUseCaseResponse> {
		const user = await this.usersRepository.findById(input.userId);

		if (!user) {
			return left(new NotFoundError("User", input.userId));
		}

		return right({ user });
	}
}
