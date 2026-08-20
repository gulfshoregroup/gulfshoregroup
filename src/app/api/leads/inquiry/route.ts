import { NextRequest } from "next/server";
import { requireLead } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { errorResponse, successResponse } from "@/lib/api/responses";
import { checkRateLimit, rateLimitKey } from "@/lib/api/rate-limit";
import { createInquiryAndNotifyAdmin } from "@/lib/leads/services/inquiry.service";
import { createInquirySchema } from "@/lib/leads/validation";

export async function POST(req: NextRequest) {
	try {
		const lead = await requireLead();
		const rate = checkRateLimit({
			key: rateLimitKey("leads:inquiry", lead.id),
			limit: 20,
			windowMs: 60_000,
		});

		if (!rate.allowed) {
			return errorResponse("Too many requests", 429, {
				code: "RATE_LIMITED",
			});
		}

		const body = createInquirySchema.parse(await req.json());
		const inquiry = await createInquiryAndNotifyAdmin({
			leadId: lead.id,
			type: body.type,
			message: body.message,
			propertyId: body.propertyId,
		});

		return successResponse(inquiry, 201);
	} catch (error) {
		return handleApiError(error);
	}
}
