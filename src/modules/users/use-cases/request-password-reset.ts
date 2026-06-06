import { randomUUID } from "node:crypto";
import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";
import { env } from "@/env";
import type { MailProvider } from "@/lib/mail";
import type {
	PasswordResetTokensRepository,
	UsersRepository,
} from "../repository";

interface RequestPasswordResetUseCaseRequest {
	email: string;
}

type RequestPasswordResetUseCaseResponse = Either<NotFoundError, void>;

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hora

export class RequestPasswordResetUseCase {
	constructor(
		private readonly usersRepository: UsersRepository,
		private readonly passwordResetTokensRepository: PasswordResetTokensRepository,
		private readonly mailProvider: MailProvider
	) {}

	async execute(
		input: RequestPasswordResetUseCaseRequest
	): Promise<RequestPasswordResetUseCaseResponse> {
		const user = await this.usersRepository.findByEmail(input.email);

		if (!user) {
			return left(new NotFoundError("User", `email: ${input.email}`));
		}

		// Remove tokens anteriores do usuário
		await this.passwordResetTokensRepository.deleteByUserId(user.id);

		// Gera novo token
		const token = randomUUID();
		const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS);

		await this.passwordResetTokensRepository.create({
			token,
			userId: user.id,
			expiresAt,
		});

		const resetLink = `${env.WEB_URL}/change-password?token=${token}`;

		// Envia e-mail com o link de redefinição
		const subject = "Redefinição de senha - Vero";
		const body = `
			<h1>Redefinição de Senha</h1>
			<p>Olá, ${user.name}!</p>
			<p>Recebemos uma solicitação para redefinir sua senha.</p>
			<p>Clique no link abaixo para redefinir sua senha:</p>
			<p><a href="${resetLink}">${resetLink}</a></p>
			<p>Este link expira em 1 hora.</p>
			<p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
		`;

		await this.mailProvider.sendMail(user.email, subject, body);

		return right(undefined);
	}
}
