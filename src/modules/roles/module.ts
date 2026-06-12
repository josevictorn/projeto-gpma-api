import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
import { defineModule } from "@/core/module";
import { RolesRepository } from "./repository";
import {
	createRoleSchema,
	responseRoleSchema,
	roles,
	updateRoleSchema,
} from "./schema";

export async function rolesModule(app: FastifyInstance) {
	// Registra as rotas CRUD automáticas, mas protegidas pelo middleware
	// O Fastify executa o array de funções em ordem
	await app.register(
		defineModule({
			resource: "roles",
			singular: "role",
			table: roles,
			schemas: {
				create: createRoleSchema,
				edit: updateRoleSchema,
				response: responseRoleSchema,
			},
			repository: new RolesRepository(),
			// Para rotas genéricas, usamos apenas a autenticação.
			// Para rotas sensíveis como DELETE, o ideal é sobrescrever ou adicionar um hook específico
			middlewares: [verifyJWT],
		})
	);
}
