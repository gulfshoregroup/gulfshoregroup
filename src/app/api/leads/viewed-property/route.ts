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
	listViewedProperties,
	trackViewedProperty,
} from "@/lib/leads/services/viewed-property.service";
import {
	listViewedPropertyQuerySchema,
	trackViewedPropertySchema,
} from "@/lib/leads/validation";

export async function POST(req: NextRequest) {
	try {
		const lead = await requireLead();
		const rate = checkRateLimit({
			key: rateLimitKey("leads:viewed-property", lead.id),
			limit: 120,
			windowMs: 60_000,
		});

		if (!rate.allowed) {
			return errorResponse("Too many requests", 429, {
				code: "RATE_LIMITED",
			});
		}

		const body = trackViewedPropertySchema.parse(await req.json());
		const result = await trackViewedProperty(lead.id, body.propertyId);

		// Recalculate score asynchronously
		import("@/lib/leads/services/scoring.service").then(({ recalculateLeadScore }) => {
			recalculateLeadScore(lead.id);
		});

		// Check for hot lead spike asynchronously
		import("@/lib/leads/services/hot-alert.service").then(({ checkAndSendHotLeadAlert }) => {
			checkAndSendHotLeadAlert(lead.id, lead.fullName || lead.email || "Unknown Lead", lead.phone || null);
		});

		// Check for returning visitor asynchronously
		import("@/lib/leads/services/returning-visitor.service").then(({ checkAndSendReturningVisitorAlert }) => {
			checkAndSendReturningVisitorAlert(lead.id, lead.fullName || lead.email || "Unknown Lead", lead.phone || null);
		});

		return successResponse(result, result.isNewView ? 201 : 200);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function GET(req: NextRequest) {
	try {
		const lead = await requireLead();
		const params = listViewedPropertyQuerySchema.parse(
			Object.fromEntries(req.nextUrl.searchParams.entries())
		);

		const result = await listViewedProperties({
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
