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
	addToWishlist,
	listWishlist,
} from "@/lib/leads/services/wishlist.service";
import {
	listWishlistQuerySchema,
	wishlistPropertySchema,
} from "@/lib/leads/validation";

export async function POST(req: NextRequest) {
	try {
		const lead = await requireLead();
		const rate = checkRateLimit({
			key: rateLimitKey("leads:wishlist", lead.id),
			limit: 60,
			windowMs: 60_000,
		});

		if (!rate.allowed) {
			return errorResponse("Too many requests", 429, {
				code: "RATE_LIMITED",
			});
		}

		const body = wishlistPropertySchema.parse(await req.json());
		const result = await addToWishlist(lead.id, body.propertyId);

		// Recalculate score asynchronously
		import("@/lib/leads/services/scoring.service").then(({ recalculateLeadScore }) => {
			recalculateLeadScore(lead.id);
		});

		return successResponse(result, result.created ? 201 : 200);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function GET(req: NextRequest) {
	try {
		const lead = await requireLead();
		const params = listWishlistQuerySchema.parse(
			Object.fromEntries(req.nextUrl.searchParams.entries())
		);

		const result = await listWishlist({
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
