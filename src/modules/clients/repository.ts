import { DrizzleRepository } from "@/core/drizzle-repository";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { clients } from "./schema";

export class ClientsRepository extends DrizzleRepository<typeof clients> {
	async findByEmail(email: string) {
		const table = this.table as typeof clients;

		const [row] = await db.select().from(table).where(eq(table.email, email)).limit(1);

		return (row as unknown) ?? null;
	}
}
