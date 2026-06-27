import { verifyJWT } from "@/core/middleware";
import { defineModule } from "@/core/module";
import { GetClientHistoryController } from "./controllers/get-history";
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
	middlewares: [verifyJWT],
	extraRoutes: async (app) => {
		await app.register(GetClientHistoryController);
	},
});
