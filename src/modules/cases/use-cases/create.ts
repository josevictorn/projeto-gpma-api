import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";
import type { ClientsRepository } from "@/modules/clients/repository";
import type { CasesRepository } from "../repository";
import type { Case } from "../schema";

interface CreateCaseUseCaseRequest {
	clientId: string;
	description: string;
	title: string;
}

type CreateCaseUseCaseResponse = Either<NotFoundError, { case: Case }>;

export class CreateCaseUseCase {
	constructor(
		private readonly casesRepository: CasesRepository,
		private readonly clientsRepository: ClientsRepository
	) {}

	async execute(
		input: CreateCaseUseCaseRequest
	): Promise<CreateCaseUseCaseResponse> {
		const client = await this.clientsRepository.findById(input.clientId);

		if (!client) {
			return left(new NotFoundError("Client", input.clientId));
		}

		const newCase = await this.casesRepository.create({
			title: input.title,
			description: input.description,
			clientId: input.clientId,
		});

		return right({ case: newCase });
	}
}
