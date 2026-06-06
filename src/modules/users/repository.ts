import { eq } from "drizzle-orm";
import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import {
	type PasswordResetToken,
	passwordResetTokens,
	type User,
	users,
} from "./schema";

export class UsersRepository extends DrizzleRepository<typeof users> {
	async findByEmail(email: string): Promise<User | null> {
		const [row] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		return row ?? null;
	}
}

export class PasswordResetTokensRepository extends DrizzleRepository<
	typeof passwordResetTokens
> {
	async findByToken(token: string): Promise<PasswordResetToken | null> {
		const [row] = await db
			.select()
			.from(passwordResetTokens)
			.where(eq(passwordResetTokens.token, token))
			.limit(1);

		return row ?? null;
	}

	async deleteByUserId(userId: string): Promise<void> {
		await db
			.delete(passwordResetTokens)
			.where(eq(passwordResetTokens.userId, userId));
	}
}
