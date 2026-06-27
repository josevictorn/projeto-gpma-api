import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";
import type { CasesRepository } from "@/modules/cases/repository";
import type { Case } from "@/modules/cases/schema";
import type { ClientsRepository } from "../repository";

interface GetClientHistoryUseCaseRequest {
	clientId: string;
}

type GetClientHistoryUseCaseResponse = Either<
	NotFoundError,
	{ history: Case[] }
>;

export class GetClientHistoryUseCase {
	constructor(
		private readonly clientsRepository: ClientsRepository,
		private readonly casesRepository: CasesRepository
	) {}

	async execute(
		input: GetClientHistoryUseCaseRequest
	): Promise<GetClientHistoryUseCaseResponse> {
		const client = await this.clientsRepository.findById(input.clientId);

		if (!client) {
			return left(new NotFoundError("Client", input.clientId));
		}

		const casesList = await this.casesRepository.findByClientId(input.clientId);

		return right({ history: casesList });
	}
}
