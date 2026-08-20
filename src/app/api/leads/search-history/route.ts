import { NextRequest } from "next/server";
import { requireLead } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import {
	errorResponse,
	paginatedResponse,
	successResponse,
} from "@/lib/api/responses";
import { checkRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import {
	createSearchHistoryEntry,
	listSearchHistory,
} from "@/lib/leads/services/search-history.service";
import {
	createSearchHistorySchema,
	listSearchHistoryQuerySchema,
} from "@/lib/leads/validation";

export async function POST(req: NextRequest) {
	try {
		const lead = await requireLead();
		const rate = checkRateLimit({
			key: rateLimitKey("leads:search-history", lead.id),
			limit: 60,
			windowMs: 60_000,
		});

		if (!rate.allowed) {
			return errorResponse("Too many requests", 429, {
				code: "RATE_LIMITED",
			});
		}

		const body = createSearchHistorySchema.parse(await req.json());
		const entry = await createSearchHistoryEntry({
			leadId: lead.id,
			filters: body.filters,
			resultCount: body.resultCount,
		});

		return successResponse(entry, 201);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function GET(req: NextRequest) {
	try {
		const lead = await requireLead();
		const params = listSearchHistoryQuerySchema.parse(
			Object.fromEntries(req.nextUrl.searchParams.entries())
		);

		const result = await listSearchHistory({
			leadId: lead.id,
			page: params.page,
			limit: params.limit,
			sortBy: params.sortBy,
			sortOrder: params.sortOrder,
		});

		return paginatedResponse(result);
	} catch (error) {
		return handleApiError(error);
	}
}
