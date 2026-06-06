import "@fastify/jwt";
import type { roleEnum } from "@/modules/users/schema";

declare module "@fastify/jwt" {
	export interface FastifyJWT {
		user: {
			sub: string;
			role: roleEnum;
		};
	}
}
