import { eq } from "drizzle-orm";
import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import { type User, users } from "./schema";

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
