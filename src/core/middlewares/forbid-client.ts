import type { FastifyReply, FastifyRequest } from "fastify";
import { ForbiddenError } from "@/core/errors";

interface UserPayload {
  role: string;
}

export function forbidClientAll(request: FastifyRequest, _reply: FastifyReply) {
  const user = request.user as UserPayload;

  if (user?.role === "CLIENT") {
    throw new ForbiddenError("Usuário do tipo CLIENT não tem acesso a este recurso.");
  }
}

export function forbidClientModify(request: FastifyRequest, _reply: FastifyReply) {
  const user = request.user as UserPayload;

  // bloqueia métodos não-GET para CLIENT
  if (user?.role === "CLIENT" && request.method !== "GET") {
    throw new ForbiddenError("Usuário do tipo CLIENT não pode criar/alterar recursos.");
  }
}
