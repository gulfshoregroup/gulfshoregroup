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
	createSavedSearch,
	listSavedSearches,
} from "@/lib/leads/services/saved-search.service";
import {
	createSavedSearchSchema,
	listSavedSearchQuerySchema,
} from "@/lib/leads/validation";

export async function POST(req: NextRequest) {
	try {
		const lead = await requireLead();
		const rate = checkRateLimit({
			key: rateLimitKey("leads:saved-search", lead.id),
			limit: 30,
			windowMs: 60_000,
		});

		if (!rate.allowed) {
			return errorResponse("Too many requests", 429, {
				code: "RATE_LIMITED",
			});
		}

		const body = createSavedSearchSchema.parse(await req.json());
		const savedSearch = await createSavedSearch({
			leadId: lead.id,
			name: body.name,
			filters: body.filters,
			frequency: body.frequency,
			notify: body.notify,
		});

		return successResponse(savedSearch, 201);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function GET(req: NextRequest) {
	try {
		const lead = await requireLead();
		const params = listSavedSearchQuerySchema.parse(
			Object.fromEntries(req.nextUrl.searchParams.entries())
		);

		const result = await listSavedSearches({
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
