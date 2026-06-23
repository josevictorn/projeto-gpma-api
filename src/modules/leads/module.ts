import { verifyJWT } from "@/core/middleware";
import { forbidClientAll } from "@/core/middlewares/forbid-client";
import { defineModule } from "@/core/module";
import {
	createLeadSchema,
	leads,
	responseLeadSchema,
	updateLeadSchema,
} from "./schema";

export const leadsModule = defineModule({
	resource: "leads",
	singular: "lead",
	table: leads,
	schemas: {
		create: createLeadSchema,
		edit: updateLeadSchema,
		response: responseLeadSchema,
	},
	middlewares: [verifyJWT, forbidClientAll],
});
