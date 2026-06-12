import { eq } from "drizzle-orm";
import { type Either, left, right } from "@/core/either";
import { ConflictError } from "@/core/errors";
import { db } from "@/lib/db";
import { roles } from "../schema";

interface CreateRoleRequest {
	description?: string | null;
	name: string;
	permissions: string;
}

type CreateRoleResponse = Either<
	ConflictError,
	{ role: typeof roles.$inferSelect }
>;

export class CreateRoleUseCase {
	async execute({
		name,
		description,
		permissions,
	}: CreateRoleRequest): Promise<CreateRoleResponse> {
		const [existingRole] = await db
			.select()
			.from(roles)
			.where(eq(roles.name, name))
			.limit(1);

		if (existingRole) {
			return left(new ConflictError("Role", "name", name));
		}

		const [role] = await db
			.insert(roles)
			.values({
				name,
				description,
				permissions,
			})
			.returning();

		return right({ role });
	}
}
