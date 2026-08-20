import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import {
	buildPaginatedResult,
	type PaginatedResult,
} from "@/lib/api/pagination";
import { SEARCH_HISTORY_DEDUPE_WINDOW_MS } from "@/lib/leads/constants";
import {
	buildSearchFingerprint,
	normalizeSearchFilters,
} from "@/lib/leads/search-fingerprint";
import type { SearchFiltersInput } from "@/lib/leads/validation";
import { ApiError } from "@/lib/api/errors";

type CreateSearchHistoryInput = {
	leadId: string;
	filters: SearchFiltersInput;
	resultCount?: number;
};

type ListSearchHistoryOptions = {
	leadId: string;
	page: number;
	limit: number;
	sortBy: "createdAt" | "updatedAt";
	sortOrder: "asc" | "desc";
};

export async function createSearchHistoryEntry(
	input: CreateSearchHistoryInput
) {
	const filters = normalizeSearchFilters(input.filters);
	const fingerprint = buildSearchFingerprint(filters);
	const dedupeSince = new Date(
		Date.now() - SEARCH_HISTORY_DEDUPE_WINDOW_MS
	);

	const recentDuplicate = await prisma.searchHistory.findFirst({
		where: {
			userId: input.leadId,
			fingerprint,
			updatedAt: { gte: dedupeSince },
		},
		orderBy: { updatedAt: "desc" },
	});

	if (recentDuplicate) {
		return prisma.searchHistory.update({
			where: { id: recentDuplicate.id },
			data: {
				updatedAt: new Date(),
				resultCount: input.resultCount ?? recentDuplicate.resultCount,
				filters: filters as Prisma.InputJsonValue,
			},
		});
	}

	return prisma.searchHistory.create({
		data: {
			userId: input.leadId,
			fingerprint,
			filters: filters as Prisma.InputJsonValue,
			resultCount: input.resultCount,
		},
	});
}

export async function listSearchHistory(
	options: ListSearchHistoryOptions
): Promise<PaginatedResult<unknown>> {
	const { leadId, page, limit, sortBy, sortOrder } = options;
	const skip = (page - 1) * limit;
	const where = { userId: leadId };

	const [total, items] = await prisma.$transaction([
		prisma.searchHistory.count({ where }),
		prisma.searchHistory.findMany({
			where,
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit,
		}),
	]);

	return buildPaginatedResult(items, total, page, limit);
}

export async function deleteSearchHistoryEntry(
	leadId: string,
	searchHistoryId: string
) {
	const existing = await prisma.searchHistory.findFirst({
		where: { id: searchHistoryId, userId: leadId },
	});

	if (!existing) {
		throw new ApiError(
			404,
			"Search history entry not found",
			"SEARCH_HISTORY_NOT_FOUND"
		);
	}

	await prisma.searchHistory.delete({ where: { id: searchHistoryId } });
	return { id: searchHistoryId };
}
