export interface PaginationParams {
	page: number;
	perPage?: number;
}

export interface PaginatedResult<T> {
	items: T[];
	total: number;
}

export interface PaginationMeta {
	currentPage: number;
	perPage: number;
	totalCount: number;
	totalPages: number;
}

export const DEFAULT_PER_PAGE = 20;

/**
 * Constrói metadados de paginação.
 * @param page Página atual
 * @param total Total de registros
 * @param perPage Registros por página
 * @returns Metadados de paginação
 */
export function buildMeta(
	page: number,
	total: number,
	perPage = DEFAULT_PER_PAGE
): PaginationMeta {
	return {
		currentPage: page,
		totalCount: total,
		perPage,
		totalPages: Math.ceil(total / perPage),
	};
}
