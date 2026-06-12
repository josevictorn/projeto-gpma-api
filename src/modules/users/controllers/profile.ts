import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError } from "@/core/errors";
import { verifyJWT } from "@/core/middleware";
import { userPresenter } from "../presenter";
import { UsersRepository } from "../repository";
import { userResponseSchema, users } from "../schema";
import { ProfileUseCase } from "../use-cases/profile";

export const ProfileController: FastifyPluginAsyncZod = async (app) => {
	app.get(
		"/users/profile",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["users"],
				summary: "Get the authenticated user's profile",
				response: {
					200: z.object({ user: userResponseSchema }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					401: z.object({ message: z.string() }).describe("Unauthorized."),
					404: z.object({ message: z.string() }).describe("User not found."),
				},
			},
		},
		async (request, reply) => {
			const getProfileUseCase = new ProfileUseCase(
				new UsersRepository(users, users.id)
			);

			const user = request.user.sub;

			const result = await getProfileUseCase.execute({ userId: user });

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

			const { user: profile } = result.value;

			return reply.status(200).send({ user: userPresenter(profile) });
		}
	);
};
