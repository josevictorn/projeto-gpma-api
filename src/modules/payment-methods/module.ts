import { verifyJWT, verifyRole } from "@/core/middleware";
import { defineModule } from "@/core/module";
import { PaymentMethodsRepository } from "./repository";
import {
	createPaymentMethodSchema,
	paymentMethods,
	responsePaymentMethodSchema,
	updatePaymentMethodSchema,
} from "./schema";

export const paymentMethodsModule = defineModule({
	resource: "payment-methods",
	singular: "payment-method",
	table: paymentMethods,
	schemas: {
		create: createPaymentMethodSchema,
		edit: updatePaymentMethodSchema,
		response: responsePaymentMethodSchema,
	},
	repository: new PaymentMethodsRepository(),
	middlewares: [
		verifyJWT,
		async (request, reply) => {
			if (["POST", "PATCH", "DELETE"].includes(request.method)) {
				await verifyRole(["ADMIN"])(request, reply);
			}
		},
	],
});
