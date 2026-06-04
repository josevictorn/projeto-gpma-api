import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { FastifyInstance, onRequestHookHandler } from "fastify";
import type { ZodObject, ZodRawShape } from "zod";
import type { IRepository } from "./base-repository";
import {
	type CrudControllerOptions,
	createCrudController,
} from "./crud-controller";
import { DrizzleRepository } from "./drizzle-repository";
import type { PresenterFn } from "./presenter";

export interface ModuleDefinition<
	TSelect extends Record<string, unknown> & { id: string },
	TInsert,
> {
	/** Rotas a desabilitar */
	except?: CrudControllerOptions<TSelect, TInsert>["except"];
	/** Rotas adicionais (custom endpoints) */
	extraRoutes?: (app: FastifyInstance) => Promise<void>;
	/** Middlewares (opcional) */
	middlewares?: onRequestHookHandler[];
	/** Rotas a habilitar (default: todas) */
	only?: CrudControllerOptions<TSelect, TInsert>["only"];
	/** Presenter customizado (opcional) */
	presenter?: PresenterFn<TSelect>;
	/** Repositório customizado (opcional — default: DrizzleRepository) */
	repository?: IRepository<TSelect, TInsert>;
	/** Nome do recurso (plural), ex: "leads" */
	resource: string;
	/** Schemas Zod */
	schemas: {
		create: ZodObject<ZodRawShape>;
		edit: ZodObject<ZodRawShape>;
		response: ZodObject<ZodRawShape>;
	};
	/** Nome singular, ex: "lead" */
	singular: string;
	/** Tabela Drizzle */
	table: PgTable & { id: PgColumn };
	/** Use Cases customizados */
	useCases?: CrudControllerOptions<TSelect, TInsert>["useCases"];
}

/**
 * Factory principal do Slate.
 * Define um módulo completo (schema → repo → use cases → controller)
 * com uma única chamada.
 * @template TTable Tabela Drizzle
 * @template TSelect Tipo da entidade (inferido do Drizzle schema)
 * @template TInsert Tipo de inserção (inferido do Drizzle schema)
 * @param definition Definição do módulo
 * @returns Função que registra o módulo no Fastify
 * @example
 * ```ts
 * defineModule({
 * 	resource: "leads",
 * 	singular: "lead",
 * 	table: leads,
 * 	schemas: {
 * 		create: leadCreateSchema,
 * 		edit: leadEditSchema,
 * 		response: leadResponseSchema,
 * 	},
 * 	useCases: {
 * 		create: new CreateLeadUseCase(),
 * 	},
 * });
 * ```
 */
export function defineModule<
	TTable extends PgTable & { id: PgColumn },
	TSelect extends Record<string, unknown> & {
		id: string;
	} = TTable["$inferSelect"] & { id: string },
	TInsert = TTable["$inferInsert"],
>(
	definition: ModuleDefinition<TSelect, TInsert>
): (app: FastifyInstance) => Promise<void> {
	const repository =
		definition.repository ??
		new DrizzleRepository(definition.table, definition.table.id);

	const controller = createCrudController({
		resource: definition.resource,
		singular: definition.singular,
		createSchema: definition.schemas.create,
		editSchema: definition.schemas.edit,
		responseSchema: definition.schemas.response,
		repository: repository as IRepository<TSelect, TInsert>,
		presenter: definition.presenter,
		middlewares: definition.middlewares,
		only: definition.only,
		except: definition.except,
		useCases: definition.useCases,
	});

	return async (app: FastifyInstance) => {
		await app.register(controller);

		if (definition.extraRoutes) {
			await app.register(definition.extraRoutes);
		}
	};
}
