import prisma from "@/lib/prisma";
import type { AlertFrequency, Prisma } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/api/errors";
import {
	buildPaginatedResult,
	type PaginatedResult,
} from "@/lib/api/pagination";
import {
	LEAD_ADMIN_ACTIONS,
	notifyAdminLeadAction,
} from "@/lib/leads/admin-notify";
import type { SearchFiltersInput } from "@/lib/leads/validation";
import { normalizeSearchFilters } from "@/lib/leads/search-fingerprint";

type CreateSavedSearchInput = {
	leadId: string;
	name?: string;
	filters: SearchFiltersInput;
	frequency: AlertFrequency;
	notify: boolean;
};

type UpdateSavedSearchInput = {
	leadId: string;
	id: string;
	name?: string;
	filters?: SearchFiltersInput;
	frequency?: AlertFrequency;
	notify?: boolean;
};

type ListSavedSearchOptions = {
	leadId: string;
	page: number;
	limit: number;
	sortBy: "createdAt" | "updatedAt";
	sortOrder: "asc" | "desc";
};

export async function createSavedSearch(input: CreateSavedSearchInput) {
	const filters = normalizeSearchFilters(input.filters);

	const lead = await prisma.lead.findUnique({
		where: { id: input.leadId },
		select: {
			id: true,
			email: true,
			fullName: true,
			firstName: true,
			lastName: true,
		},
	});

	const savedSearch = await prisma.savedSearch.create({
		data: {
			userId: input.leadId,
			name: input.name,
			filters: filters as Prisma.InputJsonValue,
			frequency: input.frequency,
			notify: input.notify,
		},
	});

	if (lead) {
		notifyAdminLeadAction({
			action: LEAD_ADMIN_ACTIONS.SAVE_SEARCH,
			lead,
			searchName: savedSearch.name ?? undefined,
			filters: filters as Record<string, unknown>,
		});
	}

	return savedSearch;
}

export async function listSavedSearches(
	options: ListSavedSearchOptions
): Promise<PaginatedResult<unknown>> {
	const { leadId, page, limit, sortBy, sortOrder } = options;
	const skip = (page - 1) * limit;
	const where = { userId: leadId };

	const [total, items] = await prisma.$transaction([
		prisma.savedSearch.count({ where }),
		prisma.savedSearch.findMany({
			where,
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit,
		}),
	]);

	return buildPaginatedResult(items, total, page, limit);
}

export async function updateSavedSearch(input: UpdateSavedSearchInput) {
	const existing = await prisma.savedSearch.findFirst({
		where: { id: input.id, userId: input.leadId },
	});

	if (!existing) {
		throw new ApiError(
			404,
			"Saved search not found",
			"SAVED_SEARCH_NOT_FOUND"
		);
	}

	return prisma.savedSearch.update({
		where: { id: input.id },
		data: {
			...(input.name !== undefined ? { name: input.name } : {}),
			...(input.filters !== undefined
				? {
						filters: normalizeSearchFilters(
							input.filters
						) as Prisma.InputJsonValue,
					}
				: {}),
			...(input.frequency !== undefined
				? { frequency: input.frequency }
				: {}),
			...(input.notify !== undefined ? { notify: input.notify } : {}),
		},
	});
}

export async function deleteSavedSearch(leadId: string, id: string) {
	const existing = await prisma.savedSearch.findFirst({
		where: { id, userId: leadId },
	});

	if (!existing) {
		throw new ApiError(
			404,
			"Saved search not found",
			"SAVED_SEARCH_NOT_FOUND"
		);
	}

	await prisma.savedSearch.delete({ where: { id } });
	return { id };
}
