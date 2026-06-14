import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/core/middleware";
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
	middlewares: [verifyJWT],
	except: ["create"],
});

export async function casesModule(app: FastifyInstance) {
	await app.register(casesModuleLoader);
	await app.register(CreateCaseController);
}
