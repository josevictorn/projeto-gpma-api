import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
import z from "zod";
import { forbidClientModify } from "@/core/middlewares/forbid-client";
import { defineModule } from "@/core/module";
import { CreateCaseController } from "./controllers/create";
import {
	cases,
	createCaseSchema,
	responseCaseSchema,
	updateCaseSchema,
} from "./schema";

export const casesModuleLoader = defineModule({
	resource: "cases",
	singular: "case",
	table: cases,
	schemas: {
		create: createCaseSchema,
		edit: updateCaseSchema,
		response: responseCaseSchema,
	},
	middlewares: [verifyJWT, forbidClientModify],
	except: ["create", "fetch", "get"],
});

export async function casesModule(app: FastifyInstance) {
	await app.register(casesModuleLoader);
	await app.register(CreateCaseController);

	// Custom fetch/get routes to enforce CLIENT scoping
	await app.register(async (app) => {
		const { CasesRepository } = await import("./repository");
		const { ClientsRepository } = await import("@/modules/clients/repository");
		const { UsersRepository } = await import("@/modules/users/repository");
		const { cases } = await import("./schema");
		const { clients } = await import("@/modules/clients/schema");
		const { users } = await import("@/modules/users/schema");
		const { snakeCasePresenter } = await import("@/core/presenter");

		app.get(
			"/cases",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: ["cases"],
					summary: "List cases (paginated) - scoped for CLIENT",
					querystring: z.object({ page: z.coerce.number().int().positive().default(1) }),
					response: {
						200: z.object({ results: z.array(responseCaseSchema), meta: z.object({ currentPage: z.number(), totalCount: z.number(), perPage: z.number(), totalPages: z.number() }) }),
					},
				},
			},
			async (request, reply) => {
				const page = request.query.page as number;
				const user = request.user as any;

				const casesRepo = new CasesRepository(cases, cases.id);

				if (user?.role === "CLIENT") {
					const clientsRepo = new ClientsRepository(clients, clients.id);
					const client = await clientsRepo.findByEmail(user.email);
					if (!client) {
						return reply.status(200).send({ results: [], meta: { currentPage: page, totalCount: 0, perPage: 10, totalPages: 0 } });
					}

					const result = await casesRepo.findManyByClientId({ page, clientId: client.id });
					return reply.status(200).send({ results: result.items.map(snakeCasePresenter), meta: { currentPage: page, totalCount: result.total, perPage: 10, totalPages: Math.ceil(result.total / 10) } });
				}

				if (user?.role === "LAWYER") {
					const usersRepo = new UsersRepository(users, users.id);
					const lawyer = await usersRepo.findByEmail(user.email);
					if (!lawyer) {
						return reply.status(200).send({ results: [], meta: { currentPage: page, totalCount: 0, perPage: 10, totalPages: 0 } });
					}

					const result = await casesRepo.findManyByLawyerId({ page, lawyerId: lawyer.id });
					return reply.status(200).send({ results: result.items.map(snakeCasePresenter), meta: { currentPage: page, totalCount: result.total, perPage: 10, totalPages: Math.ceil(result.total / 10) } });
				}

				// Non-client/non-lawyer: fallback to default fetch behaviour
				const result = await casesRepo.findMany({ page });
				return reply.status(200).send({ results: result.items.map(snakeCasePresenter), meta: { currentPage: page, totalCount: result.total, perPage: 10, totalPages: Math.ceil(result.total / 10) } });
			}
		);

		app.get(
			"/cases/:id",
			{
				onRequest: [verifyJWT],
				schema: {
					tags: ["cases"],
					summary: "Get case by ID - scoped for CLIENT",
					params: z.object({ id: z.uuid() }),
					response: { 200: responseCaseSchema, 404: z.object({ message: z.string() }) },
				},
			},
			async (request, reply) => {
				const { id } = request.params as any;
				const user = request.user as any;

				const casesRepo = new CasesRepository(cases, cases.id);
				const existing = await casesRepo.findById(id);
				if (!existing) {
					return reply.status(404).send({ message: "Case not found." });
				}

				if (user?.role === "CLIENT") {
					const clientsRepo = new ClientsRepository(clients, clients.id);
					const client = await clientsRepo.findByEmail(user.email);
					if (!client || client.id !== (existing as any).clientId) {
						return reply.status(404).send({ message: "Case not found." });
					}
				}

				if (user?.role === "LAWYER") {
					const usersRepo = new UsersRepository(users, users.id);
					const lawyer = await usersRepo.findByEmail(user.email);
					if (!lawyer || lawyer.id !== (existing as any).assignedLawyerId) {
						return reply.status(404).send({ message: "Case not found." });
					}
				}

				return reply.status(200).send(snakeCasePresenter(existing));
			}
		);
	});
}
