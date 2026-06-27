import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import z from "zod";
import { NotFoundError } from "@/core/errors";
import { verifyJWT } from "@/core/middleware";
import { CasesRepository } from "@/modules/cases/repository";
import { cases } from "@/modules/cases/schema";
import { CaseUpdatesRepository } from "../repository";
import { caseUpdates, responseCaseUpdateSchema } from "../schema";
import { CreateCaseUpdateUseCase } from "../use-cases/create";
import { ListCaseUpdatesUseCase } from "../use-cases/list-by-case";

export const CaseUpdatesCustomController: FastifyPluginAsyncZod = async (
	app
) => {
	app.post(
		"/cases/:caseId/updates",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["case-updates"],
				summary: "Create a new case update",
				params: z.object({
					caseId: z.string().uuid(),
				}),
				body: z.object({
					date: z.coerce.date(),
					type: z.string().min(1),
					description: z.string().min(1),
				}),
				response: {
					201: z.object({ case_update: responseCaseUpdateSchema }),
					400: z.object({ message: z.string() }).describe("Invalid request."),
					401: z.object({ message: z.string() }).describe("Unauthorized."),
					404: z.object({ message: z.string() }).describe("Case not found."),
				},
			},
		},
		async (request, reply) => {
			const { caseId } = request.params;
			const { date, type, description } = request.body;

			const createCaseUpdateUseCase = new CreateCaseUpdateUseCase(
				new CaseUpdatesRepository(caseUpdates, caseUpdates.id),
				new CasesRepository(cases, cases.id)
			);

			const result = await createCaseUpdateUseCase.execute({
				caseId,
				date,
				type,
				description,
			});

			if (result.isLeft()) {
				const error = result.value;
				if (error instanceof NotFoundError) {
					return reply
						.status(error.statusCode)
						.send({ message: error.message });
				}
				return reply
					.status(400)
					.send({ message: "An unexpected error occurred." });
			}

			const update = result.value.caseUpdate;
			return reply.status(201).send({
				case_update: {
					id: update.id,
					case_id: update.caseId,
					date: update.date,
					type: update.type,
					description: update.description,
					created_at: update.createdAt || new Date(),
					updated_at: update.updatedAt || new Date(),
				},
			});
		}
	);

	app.get(
		"/cases/:caseId/updates",
		{
			onRequest: [verifyJWT],
			schema: {
				tags: ["case-updates"],
				summary: "List all updates for a case",
				params: z.object({
					caseId: z.string().uuid(),
				}),
				response: {
					200: z.object({
						case_updates: z.array(responseCaseUpdateSchema),
					}),
					400: z.object({ message: z.string() }).describe("Bad request."),
					401: z.object({ message: z.string() }).describe("Unauthorized."),
					404: z.object({ message: z.string() }).describe("Case not found."),
				},
			},
		},
		async (request, reply) => {
			const { caseId } = request.params;

			const listCaseUpdatesUseCase = new ListCaseUpdatesUseCase(
				new CaseUpdatesRepository(caseUpdates, caseUpdates.id),
				new CasesRepository(cases, cases.id)
			);

			const result = await listCaseUpdatesUseCase.execute({ caseId });

			if (result.isLeft()) {
				const error = result.value;
				if (error instanceof NotFoundError) {
					return reply
						.status(error.statusCode)
						.send({ message: error.message });
				}
				return reply
					.status(400)
					.send({ message: "An unexpected error occurred." });
			}

			const formattedUpdates = result.value.caseUpdates.map((update) => ({
				id: update.id,
				case_id: update.caseId,
				date: update.date,
				type: update.type,
				description: update.description,
				created_at: update.createdAt || new Date(),
				updated_at: update.updatedAt || new Date(),
			}));

			return reply.status(200).send({ case_updates: formattedUpdates });
		}
	);
};
