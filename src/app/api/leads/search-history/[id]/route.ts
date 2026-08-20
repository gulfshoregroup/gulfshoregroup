import { NextRequest } from "next/server";
import { requireLead } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { successResponse } from "@/lib/api/responses";
import { deleteSearchHistoryEntry } from "@/lib/leads/services/search-history.service";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function DELETE(_req: NextRequest, context: RouteContext) {
	try {
		const lead = await requireLead();
		const { id } = await context.params;
		const result = await deleteSearchHistoryEntry(lead.id, id);
		return successResponse(result);
	} catch (error) {
		return handleApiError(error);
	}
}
