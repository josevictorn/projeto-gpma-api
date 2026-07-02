import type { FastifyReply, onRequestHookHandler } from "fastify";
import { type ZodObject, type ZodRawShape, z } from "zod";
import { app } from "@/infra/app";
import type { IRepository } from "./base-repository";
import {
	CreateUseCase,
	DeleteUseCase,
	EditUseCase,
	FetchUseCase,
	GetUseCase,
} from "./crud-use-case";
import type { AppError } from "./errors";
import { type PresenterFn, snakeCasePresenter } from "./presenter";

export interface CrudControllerOptions<TSelect, TInsert> {
	/** Schema Zod para criação (body do POST) */
	createSchema: ZodObject<ZodRawShape>;
	/** Schema Zod para edição (body do PATCH) */
	editSchema: ZodObject<ZodRawShape>;
	/** Quais rotas CRUD desabilitar */
	except?: ("create" | "fetch" | "get" | "edit" | "delete")[];
	/** Middlewares a aplicar em todas as rotas */
	middlewares?: onRequestHookHandler[];
	/** Quais rotas CRUD habilitar (default: todas) */
	only?: ("create" | "fetch" | "get" | "edit" | "delete")[];
	/** Prefix da rota (default: `/${resource}`) */
	prefix?: string;
	/** Presenter para transformar entity → response */
	presenter?: PresenterFn<TSelect>;
	/** Repositório do recurso */
	repository: IRepository<TSelect, TInsert | Partial<TSelect>>;
	/** Nome do recurso, ex: "leads" (usado em rotas e tags) */
	resource: string;
	/** Schema Zod para resposta (serialização) */
	responseSchema: ZodObject<ZodRawShape>;
	/** Nome singular, ex: "lead" (usado em mensagens) */
	singular: string;
	/** Use Cases customizados (override dos genéricos) */
	useCases?: {
		create?: CreateUseCase<TSelect, TInsert>;
		get?: GetUseCase<TSelect>;
		fetch?: FetchUseCase<TSelect>;
		edit?: EditUseCase<TSelect>;
		delete?: DeleteUseCase<TSelect>;
	};
}

const ALL_ACTIONS = ["create", "fetch", "get", "edit", "delete"] as const;
/**
 * Cria um controller CRUD genérico.
 * @param options Opções do controller
 * @template TSelect Tipo da entidade
 * @template TInsert Tipo de inserção
 * @returns Controller CRUD
 * @example
 * ```ts
 * const usersController = createCrudController({
 *   resource: "users",
 *   singular: "user",
 *   prefix: "/users",
 *   repository: usersRepository,
 *   createSchema: CreateUserSchema,
 *   editSchema: EditUserSchema,
 *   responseSchema: UserSchema,
 *   only: ["create", "fetch", "get", "edit", "delete"],
 * });
 * app.register(usersController);
 * ```
 */
export function createCrudController<
	TSelect extends Record<string, unknown> & { id: string },
	TInsert,
>(options: CrudControllerOptions<TSelect, TInsert>) {
	const {
		resource,
		singular,
		createSchema,
		editSchema,
		responseSchema,
		repository,
		middlewares = [],
		useCases: customUseCases = {},
	} = options;

	const present = options.presenter ?? snakeCasePresenter;
	const prefix = options.prefix ?? `/${resource}`;

	const useCases = {
		create: customUseCases.create ?? new CreateUseCase(repository, singular),
		get: customUseCases.get ?? new GetUseCase(repository, singular),
		fetch: customUseCases.fetch ?? new FetchUseCase(repository, singular),
		edit: customUseCases.edit ?? new EditUseCase(repository, singular),
		delete: customUseCases.delete ?? new DeleteUseCase(repository, singular),
	};

	const enabled = new Set(
		options.only ?? ALL_ACTIONS.filter((a) => !options.except?.includes(a))
	);

	function handleError(error: AppError | null, reply: FastifyReply) {
		return reply
			.status(error ? error.statusCode : 400)
			.send({ message: error ? error.message : "Bad Request" });
	}

	return function controller() {
		const onRequest = middlewares.length > 0 ? middlewares : undefined;

		if (enabled.has("create")) {
			app.post(
				prefix,
				{
					onRequest,
					schema: {
						tags: [resource],
						summary: `Create a new ${singular}`,
						body: createSchema,
						response: {
							201: z.object({ id: z.uuid() }),
							400: z.object({ message: z.string() }),
						},
					},
				},
				async (request, reply) => {
					const result = await useCases.create.execute(request.body as TInsert);

					if (result.isLeft()) {
						return handleError(result.value, reply);
					}

					const item = result.value.item;
					return reply.status(201).send({ id: item.id });
				}
			);
		}

		if (enabled.has("fetch")) {
			app.get(
				prefix,
				{
					onRequest,
					schema: {
						tags: [resource],
						summary: `List ${resource} (paginated)`,
						querystring: z.object({
							page: z.coerce.number().int().positive().default(1),
							search: z.string().optional(),
						}),
						response: {
							200: z.object({
								results: z.array(responseSchema),
								meta: z.object({
									currentPage: z.number(),
									totalCount: z.number(),
									perPage: z.number(),
									totalPages: z.number(),
								}),
							}),
						},
					},
				},
				async (request, reply) => {
				const { page, search } = request.query;

				const result = await useCases.fetch.execute({ page, search });
					if (result.isLeft()) {
						return handleError(result.value, reply);
					}

					return reply.status(200).send({
						results: result.value.items.map(present),
						meta: result.value.meta,
					});
				}
			);
		}

		if (enabled.has("get")) {
			app.get(
				`${prefix}/:id`,
				{
					onRequest,
					schema: {
						tags: [resource],
						summary: `Get ${singular} by ID`,
						params: z.object({ id: z.uuid() }),
						response: {
							200: responseSchema,
							404: z.object({ message: z.string() }),
						},
					},
				},
				async (request, reply) => {
					const { id } = request.params;

					const result = await useCases.get.execute({ id });

					if (result.isLeft()) {
						return handleError(result.value, reply);
					}

					return reply.status(200).send(present(result.value.item));
				}
			);
		}

		if (enabled.has("edit")) {
			app.patch(
				`${prefix}/:id`,
				{
					onRequest,
					schema: {
						tags: [resource],
						summary: `Update ${singular}`,
						params: z.object({ id: z.uuid() }),
						body: editSchema,
						response: {
							200: responseSchema,
							404: z.object({ message: z.string() }),
						},
					},
				},
				async (request, reply) => {
					const { id } = request.params;

					const data = request.body as Partial<TSelect>;

					const result = await useCases.edit.execute({ id, data });

					if (result.isLeft()) {
						return handleError(result.value, reply);
					}

					return reply.status(200).send(present(result.value.item));
				}
			);
		}

		if (enabled.has("delete")) {
			app.delete(
				`${prefix}/:id`,
				{
					onRequest,
					schema: {
						tags: [resource],
						summary: `Delete ${singular}`,
						params: z.object({ id: z.uuid() }),
						response: {
							204: z.null(),
							404: z.object({ message: z.string() }),
						},
					},
				},
				async (request, reply) => {
					const { id } = request.params;

					const result = await useCases.delete.execute({ id });

					if (result.isLeft()) {
						return handleError(result.value, reply);
					}

					return reply.status(204).send(null);
				}
			);
		}
	};
}
