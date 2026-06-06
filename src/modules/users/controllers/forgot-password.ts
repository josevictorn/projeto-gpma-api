import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { NotFoundError } from "@/core/errors";
import { NodemailerMailProvider } from "@/lib/mail";
import { PasswordResetTokensRepository, UsersRepository } from "../repository";
import { passwordResetTokens, users } from "../schema";
import { RequestPasswordResetUseCase } from "../use-cases/request-password-reset";

export const ForgotPasswordController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/users/forgot-password",
		{
			schema: {
				tags: ["users"],
				summary: "Request a password reset email",
				body: z.object({
					email: z.email(),
				}),
				response: {
					204: z.void().describe("Password reset email sent."),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					404: z.object({ message: z.string() }).describe("User not found."),
				},
			},
		},
		async (request, reply) => {
			const { email } = request.body;

			const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
				new UsersRepository(users, users.id),
				new PasswordResetTokensRepository(
					passwordResetTokens,
					passwordResetTokens.id
				),
				new NodemailerMailProvider()
			);

			const result = await requestPasswordResetUseCase.execute({ email });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case NotFoundError:
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
