import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";
import type { CasesRepository } from "@/modules/cases/repository";
import type { CaseUpdatesRepository } from "../repository";
import type { CaseUpdate } from "../schema";

interface CreateCaseUpdateUseCaseRequest {
	caseId: string;
	date: Date;
	description: string;
	type: string;
}

type CreateCaseUpdateUseCaseResponse = Either<
	NotFoundError,
	{ caseUpdate: CaseUpdate }
>;

export class CreateCaseUpdateUseCase {
	constructor(
		private readonly caseUpdatesRepository: CaseUpdatesRepository,
		private readonly casesRepository: CasesRepository
	) {}

	async execute(
		input: CreateCaseUpdateUseCaseRequest
	): Promise<CreateCaseUpdateUseCaseResponse> {
		const associatedCase = await this.casesRepository.findById(input.caseId);

		if (!associatedCase) {
			return left(new NotFoundError("Case", input.caseId));
		}

		const caseUpdate = await this.caseUpdatesRepository.create({
			caseId: input.caseId,
			date: input.date,
			type: input.type,
			description: input.description,
		});

		return right({ caseUpdate });
	}
}
