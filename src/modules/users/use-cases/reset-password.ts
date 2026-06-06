import { hash } from "argon2";
import { type Either, left, right } from "@/core/either";
import { NotFoundError, ValidationError } from "@/core/errors";
import type {
	PasswordResetTokensRepository,
	UsersRepository,
} from "../repository";

interface ResetPasswordUseCaseRequest {
	password: string;
	token: string;
}

type ResetPasswordUseCaseResponse = Either<
	NotFoundError | ValidationError,
	void
>;

export class ResetPasswordUseCase {
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly passwordResetTokensRepository: PasswordResetTokensRepository
	) {}

	async execute(
		input: ResetPasswordUseCaseRequest
	): Promise<ResetPasswordUseCaseResponse> {
		const resetToken = await this.passwordResetTokensRepository.findByToken(
			input.token
		);

		if (!resetToken) {
			return left(new NotFoundError("Token", input.token));
		}

		if (new Date() > resetToken.expiresAt) {
			// Token expirado: remove do banco e retorna erro
			await this.passwordResetTokensRepository.deleteByUserId(
				resetToken.userId
			);
			return left(new ValidationError("Token has expired."));
		}

		const user = await this.usersRepository.findById(resetToken.userId);

		if (!user) {
			return left(new NotFoundError("User", resetToken.userId));
		}

		const passwordHash = await hash(input.password);

		await this.usersRepository.save({
			...user,
			passwordHash,
		});

		// Remove todos os tokens de reset do usuário
		await this.passwordResetTokensRepository.deleteByUserId(user.id);

		return right(undefined);
	}
}
