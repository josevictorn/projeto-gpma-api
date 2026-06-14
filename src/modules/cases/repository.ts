import { DrizzleRepository } from "@/core/drizzle-repository";
import type { cases } from "./schema";

export class CasesRepository extends DrizzleRepository<typeof cases> {}
