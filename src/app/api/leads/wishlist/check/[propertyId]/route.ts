import { NextRequest } from "next/server";
import { requireLead } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { successResponse } from "@/lib/api/responses";
import { isPropertyWishlisted } from "@/lib/leads/services/wishlist.service";

type RouteContext = {
	params: Promise<{ propertyId: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
	try {
		const lead = await requireLead();
		const { propertyId } = await context.params;
		const result = await isPropertyWishlisted(lead.id, propertyId);
		return successResponse(result);
	} catch (error) {
		return handleApiError(error);
	}
}
