import { type Either, left, right } from "@/core/either";
import { NotFoundError } from "@/core/errors";
import type { CasesRepository } from "@/modules/cases/repository";
import type { CaseUpdatesRepository } from "../repository";
import type { CaseUpdate } from "../schema";

interface ListCaseUpdatesUseCaseRequest {
	caseId: string;
}

type ListCaseUpdatesUseCaseResponse = Either<
	NotFoundError,
	{ caseUpdates: CaseUpdate[] }
>;

export class ListCaseUpdatesUseCase {
	constructor(
		private readonly caseUpdatesRepository: CaseUpdatesRepository,
		private readonly casesRepository: CasesRepository
	) {}

	async execute(
		input: ListCaseUpdatesUseCaseRequest
	): Promise<ListCaseUpdatesUseCaseResponse> {
		const associatedCase = await this.casesRepository.findById(input.caseId);

		if (!associatedCase) {
			return left(new NotFoundError("Case", input.caseId));
		}

		const updates = await this.caseUpdatesRepository.findByCaseId(input.caseId);

		return right({ caseUpdates: updates });
	}
}
