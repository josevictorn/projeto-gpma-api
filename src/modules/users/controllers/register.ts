import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { ConflictError } from "@/core/errors";
import { UsersRepository } from "../repository";
import { createUserSchema, users } from "../schema";
import { RegisterUseCase } from "../use-cases/register";

export const RegisterUserController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/users",
		{
			schema: {
				tags: ["users"],
				summary: "Register a new user",
				body: createUserSchema,
				response: {
					201: z.object({ userId: z.uuid() }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Requisição inválida."),
					409: z
						.object({ message: z.string() })
						.describe("Email já está em uso."),
				},
			},
		},
		async (request, reply) => {
			const registerUseCase = new RegisterUseCase(
				new UsersRepository(users, users.id)
			);

			const result = await registerUseCase.execute(request.body);

			if (result.isLeft()) {
				const error = result.value;

				switch (error.constructor) {
					case ConflictError:
						return reply
							.status(error.statusCode)
							.send({ message: error.message });
					default:
						return reply
							.status(400)
							.send({ message: "An unexpected error occurred." });
				}
			}

			return reply.status(201).send({ userId: result.value.user.id });
		}
	);
};
