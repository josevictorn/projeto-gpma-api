import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
import { defineModule } from "@/core/module";
import { CaseUpdatesCustomController } from "./controllers/controllers";
import {
	caseUpdates,
	createCaseUpdateSchema,
	responseCaseUpdateSchema,
	updateCaseUpdateSchema,
} from "./schema";

export const caseUpdatesModuleLoader = defineModule({
	resource: "case-updates",
	singular: "case-update",
	table: caseUpdates,
	schemas: {
		create: createCaseUpdateSchema,
		edit: updateCaseUpdateSchema,
		response: responseCaseUpdateSchema,
	},
	middlewares: [verifyJWT],
	only: ["get"],
});

export async function caseUpdatesModule(app: FastifyInstance) {
	await app.register(caseUpdatesModuleLoader);
	await app.register(CaseUpdatesCustomController);
}
