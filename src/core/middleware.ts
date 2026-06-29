import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Verifica se o usuário está autenticado.
 * @param request Requisição
 * @param reply Resposta
 * @returns Void
 * @example
 * app.addHook("preHandler", verifyJWT);
 */
export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
	try {
		await request.jwtVerify();
	} catch {
		return reply.status(401).send({ message: "Unauthorized." });
	}
}

/**
 * Verifica se o usuário possui uma das roles permitidas.
 * @param allowedRoles Lista de roles permitidas
 * @returns Hook handler do Fastify
 */
export function verifyRole(allowedRoles: string[]) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const user = request.user as { role: string } | undefined;
		if (!(user && allowedRoles.includes(user.role))) {
			return reply.status(403).send({ message: "Forbidden." });
		}
	};
}
