import type { FastifyPluginAsyncZod } from "node_modules/fastify-type-provider-zod/dist/esm/core";
import { z } from "zod";
import { UnauthorizedError } from "@/core/errors";
import { userPresenter } from "../presenter";
import { UsersRepository } from "../repository";
import { userResponseSchema, users } from "../schema";
import { AuthenticateUseCase } from "../use-cases/authenticate";

export const AuthenticateController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/users/authenticate",
		{
			schema: {
				tags: ["users"],
				summary: "Authenticate a user and return a access token",
				body: z.object({
					email: z.email(),
					password: z.string().min(6),
				}),
				response: {
					200: z.object({ access_token: z.string(), user: userResponseSchema }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					401: z
						.object({ message: z.string() })
						.describe("Invalid credentials."),
				},
			},
		},
		async (request, reply) => {
			const { email, password } = request.body;

			const authenticateUseCase = new AuthenticateUseCase(
				new UsersRepository(users, users.id)
			);

			const result = await authenticateUseCase.execute({ email, password });

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case UnauthorizedError:
						return reply
							.status(error.statusCode)
							.send({ message: error.message });
					default:
						return reply
							.status(400)
							.send({ message: "An unexpected error occurred." });
				}
			}

			const { user } = result.value;

			const token = await reply.jwtSign(
				{ role: user.role },
				{
					sign: {
						sub: user.id,
					},
				}
			);

			return reply.status(200).send({
				access_token: token,
				user: userPresenter(user),
			});
		}
	);
};
