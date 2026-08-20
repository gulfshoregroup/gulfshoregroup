import { NextRequest } from "next/server";
import { requireLead } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/errors";
import { successResponse } from "@/lib/api/responses";
import {
	deleteSavedSearch,
	updateSavedSearch,
} from "@/lib/leads/services/saved-search.service";
import { updateSavedSearchSchema } from "@/lib/leads/validation";

type RouteContext = {
	params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
	try {
		const lead = await requireLead();
		const { id } = await context.params;
		const body = updateSavedSearchSchema.parse(await req.json());
		const updated = await updateSavedSearch({
			leadId: lead.id,
			id,
			...body,
		});

		return successResponse(updated);
	} catch (error) {
		return handleApiError(error);
	}
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
	try {
		const lead = await requireLead();
		const { id } = await context.params;
		const result = await deleteSavedSearch(lead.id, id);
		return successResponse(result);
	} catch (error) {
		return handleApiError(error);
	}
}
