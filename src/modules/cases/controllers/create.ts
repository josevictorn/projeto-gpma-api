import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError } from "@/core/errors";
import { verifyJWT } from "@/core/middleware";
import { ClientsRepository } from "@/modules/clients/repository";
import { clients } from "@/modules/schemas";
import { CasesRepository } from "../repository";
import { cases, createCaseSchema, responseCaseSchema } from "../schema";
import { CreateCaseUseCase } from "../use-cases/create";

export const CreateCaseController: FastifyPluginAsyncZod = async (app) => {
	app.post(
		"/cases",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["cases"],
				summary: "Create a new case",
				body: createCaseSchema,
				response: {
					201: z.object({ case: responseCaseSchema }),
					400: z
						.object({
							message: z.string(),
							issues: z.array(z.object({ message: z.string() })).optional(),
						})
						.describe("Invalid request."),
					401: z.object({ message: z.string() }).describe("Unauthorized."),
					404: z.object({ message: z.string() }).describe("Client not found."),
				},
			},
		},
		async (request, reply) => {
			const createCaseUseCase = new CreateCaseUseCase(
				new CasesRepository(cases, cases.id),
				new ClientsRepository(clients, clients.id)
			);

			const result = await createCaseUseCase.execute(request.body);

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

			return reply.status(201).send({
				case: {
					...result.value.case,
					created_at: result.value.case.createdAt || new Date(),
					updated_at: result.value.case.updatedAt || new Date(),
					client_id: result.value.case.clientId,
				},
			});
		}
	);
};
