import { DrizzleRepository } from "@/core/drizzle-repository";
import { type PaymentMethod, paymentMethods } from "./schema";

export class PaymentMethodsRepository extends DrizzleRepository<
	typeof paymentMethods,
	PaymentMethod
> {
	constructor() {
		super(paymentMethods, paymentMethods.id);
	}
}
