import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { NotFoundError, ValidationError } from "@/core/errors";
import { PasswordResetTokensRepository, UsersRepository } from "../repository";
import { passwordResetTokens, users } from "../schema";
import { ResetPasswordUseCase } from "../use-cases/reset-password";

export const ResetPasswordController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/users/reset-password",
		{
			schema: {
				tags: ["users"],
				summary: "Reset user password using a token",
				body: z.object({
					token: z.string(),
					password: z.string().min(6),
				}),
				response: {
					204: z.void().describe("Password reset successfully."),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request or expired token."),
					404: z.object({ message: z.string() }).describe("Token not found."),
				},
			},
		},
		async (request, reply) => {
			const { token, password } = request.body;

			const resetPasswordUseCase = new ResetPasswordUseCase(
				new UsersRepository(users, users.id),
				new PasswordResetTokensRepository(
					passwordResetTokens,
					passwordResetTokens.id
				)
			);

			const result = await resetPasswordUseCase.execute({
				token,
				password,
			});

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case NotFoundError:
						return reply
							.status(error.statusCode)
							.send({ message: error.message });
					case ValidationError:
						return reply
							.status(error.statusCode)
							.send({ message: error.message });
					default:
						return reply
							.status(400)
							.send({ message: "An unexpected error occurred." });
				}
			}

			return reply.status(204).send();
		}
	);
};
