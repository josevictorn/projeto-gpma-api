import { verifyJWT } from "@/core/middleware";
import { forbidClientAll } from "@/core/middlewares/forbid-client";
import { defineModule } from "@/core/module";
import {
	clients,
	createClientSchema,
	responseClientSchema,
	updateClientSchema,
} from "./schema";

export const clientsModule = defineModule({
	resource: "clients",
	singular: "client",
	table: clients,
	schemas: {
		create: createClientSchema,
		edit: updateClientSchema,
		response: responseClientSchema,
	},
	middlewares: [verifyJWT, forbidClientAll],
});
