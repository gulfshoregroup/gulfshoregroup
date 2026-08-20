import { z } from "zod";

export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	sortBy: z.string().optional(),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export type PaginatedResult<T> = {
	items: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPrevPage: boolean;
	};
};

export function parsePaginationParams(
	searchParams: URLSearchParams,
	allowedSortFields: string[],
	defaultSortBy: string
): PaginationQuery & { sortBy: string } {
	const parsed = paginationQuerySchema.parse({
		page: searchParams.get("page") ?? undefined,
		limit: searchParams.get("limit") ?? undefined,
		sortBy: searchParams.get("sortBy") ?? defaultSortBy,
		sortOrder: searchParams.get("sortOrder") ?? undefined,
	});

	const sortBy = allowedSortFields.includes(parsed.sortBy ?? "")
		? parsed.sortBy!
		: defaultSortBy;

	return { ...parsed, sortBy };
}

export function buildPaginatedResult<T>(
	items: T[],
	total: number,
	page: number,
	limit: number
): PaginatedResult<T> {
	const totalPages = Math.max(1, Math.ceil(total / limit));
	return {
		items,
		pagination: {
			page,
			limit,
			total,
			totalPages,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
		},
	};
}
