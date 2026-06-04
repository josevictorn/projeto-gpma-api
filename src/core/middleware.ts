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
