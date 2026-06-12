import { and, eq, ne } from "drizzle-orm";
import { type Either, left, right } from "@/core/either";
import { ConflictError, NotFoundError } from "@/core/errors";
import { db } from "@/lib/db";
import { roles } from "../schema";

interface UpdateRoleRequest {
	description?: string | null;
	id: string;
	name?: string;
	permissions?: string;
}

type UpdateRoleResponse = Either<
	NotFoundError | ConflictError,
	{ role: typeof roles.$inferSelect }
>;

export class UpdateRoleUseCase {
	async execute({
		id,
		name,
		description,
		permissions,
	}: UpdateRoleRequest): Promise<UpdateRoleResponse> {
		// 1. Verificar se o perfil existe
		const [existingRole] = await db
			.select()
			.from(roles)
			.where(eq(roles.id, id))
			.limit(1);

		if (!existingRole) {
			return left(new NotFoundError("Role", id));
		}

		// 2. Se o nome estiver a ser alterado, verificar se já existe outro perfil com o mesmo nome
		if (name && name !== existingRole.name) {
			const [roleWithSameName] = await db
				.select()
				.from(roles)
				.where(and(eq(roles.name, name), ne(roles.id, id)))
				.limit(1);

			if (roleWithSameName) {
				return left(new ConflictError("Role", "name", name));
			}
		}

		// 3. Efetuar a atualização dos dados (apenas os campos fornecidos)
		const [updatedRole] = await db
			.update(roles)
			.set({
				...(name && { name }),
				...(description !== undefined && { description }),
				...(permissions && { permissions }),
				updatedAt: new Date(),
			})
			.where(eq(roles.id, id))
			.returning();

		return right({ role: updatedRole });
	}
}
