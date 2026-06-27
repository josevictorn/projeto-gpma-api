import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError } from "@/core/errors";
import { verifyJWT } from "@/core/middleware";
import { CasesRepository } from "@/modules/cases/repository";
import { cases } from "@/modules/cases/schema";
import { clients } from "@/modules/schemas";
import { ClientsRepository } from "../repository";
import { GetClientHistoryUseCase } from "../use-cases/get-history";

export const GetClientHistoryController: FastifyPluginAsyncZod = async (
	app
) => {
	app.get(
		"/clients/:id/history",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["clients"],
				summary: "Get client case history",
				params: z.object({
					id: z.string().uuid(),
				}),
				response: {
					200: z.object({
						history: z.array(
							z.object({
								id: z.string().uuid(),
								title: z.string(),
								description: z.string(),
								status: z.string(),
								created_at: z.date(),
								updated_at: z.date(),
							})
						),
					}),
					400: z.object({ message: z.string() }).describe("Bad request."),
					401: z.object({ message: z.string() }).describe("Unauthorized."),
					404: z.object({ message: z.string() }).describe("Client not found."),
				},
			},
		},
		async (request, reply) => {
			const { id } = request.params;

			const getClientHistoryUseCase = new GetClientHistoryUseCase(
				new ClientsRepository(clients, clients.id),
				new CasesRepository(cases, cases.id)
			);

			const result = await getClientHistoryUseCase.execute({ clientId: id });

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

			const history = result.value.history.map((c) => ({
				id: c.id,
				title: c.title,
				description: c.description,
				status: c.status,
				created_at: c.createdAt || new Date(),
				updated_at: c.updatedAt || new Date(),
			}));

			return reply.status(200).send({ history });
		}
	);
};
