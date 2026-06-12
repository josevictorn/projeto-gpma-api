import type { FastifyReply, FastifyRequest } from "fastify";
import { ForbiddenError } from "@/core/errors";

interface UserPayload {
	permissions?: string[];
	role: string;
	sub: string;
}

export function checkPermission(requiredPermission: string) {
	return async (request: FastifyRequest, _reply: FastifyReply) => {
		const user = request.user as UserPayload;

		if (!user?.permissions?.includes(requiredPermission)) {
			throw new ForbiddenError(
				"Usuário sem permissão para acessar este recurso."
			);
		}
	};
}
