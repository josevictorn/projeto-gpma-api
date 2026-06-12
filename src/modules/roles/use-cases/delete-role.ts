import { eq } from "drizzle-orm";
import { type Either, left, right } from "@/core/either";
import { NotFoundError, ValidationError } from "@/core/errors";
import { db } from "@/lib/db";
import { roles } from "../schema";

type DeleteRoleResponse = Either<NotFoundError | ValidationError, null>;

export class DeleteRoleUseCase {
	async execute(id: string): Promise<DeleteRoleResponse> {
		const [existingRole] = await db
			.select()
			.from(roles)
			.where(eq(roles.id, id))
			.limit(1);

		if (!existingRole) {
			return left(new NotFoundError("Role", id));
		}

		// Regra: Não permitir excluir perfil "Admin" (exemplo de regra de negócio)
		if (existingRole.name === "Admin") {
			return left(
				new ValidationError("Não é possível excluir o perfil de administrador.")
			);
		}

		await db.delete(roles).where(eq(roles.id, id));
		return right(null);
	}
}
