import { DrizzleRepository } from "@/core/drizzle-repository";
import type { clients } from "./schema";

export class ClientsRepository extends DrizzleRepository<typeof clients> {}
