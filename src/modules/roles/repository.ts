import { eq } from "drizzle-orm";
import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import { roles, userRoles } from "./schema";

type Role = typeof roles.$inferSelect;

export class RolesRepository extends DrizzleRepository<typeof roles, Role> {
	constructor() {
		super(roles, roles.id);
	}

	async assignRoleToUser(userId: string, roleId: string): Promise<void> {
		await db.insert(userRoles).values({
			userId,
			roleId,
		});
	}

	async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
		await db
			.delete(userRoles)
			.where(eq(userRoles.userId, userId) && eq(userRoles.roleId, roleId));
	}

	async findRolesByUserId(userId: string) {
		return await db
			.select({
				id: roles.id,
				name: roles.name,
				permissions: roles.permissions,
			})
			.from(userRoles)
			.innerJoin(roles, eq(userRoles.roleId, roles.id))
			.where(eq(userRoles.userId, userId));
	}
}
