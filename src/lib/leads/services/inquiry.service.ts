import prisma from "@/lib/prisma";
import type { InquiryType } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/api/errors";
import {
	getPropertySummaryForAlert,
	LEAD_ADMIN_ACTIONS,
	notifyAdminLeadAction,
} from "@/lib/leads/admin-notify";

type CreateInquiryInput = {
	leadId: string;
	type: InquiryType;
	message?: string;
	propertyId?: string;
};

export async function createInquiryAndNotifyAdmin(input: CreateInquiryInput) {
	if (input.propertyId) {
		const property = await prisma.property.findUnique({
			where: { id: input.propertyId },
			select: { id: true },
		});
		if (!property) {
			throw new ApiError(404, "Property not found", "PROPERTY_NOT_FOUND");
		}
	}

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

	if (!lead) {
		throw new ApiError(404, "Lead not found", "LEAD_NOT_FOUND");
	}

	const inquiry = await prisma.inquiry.create({
		data: {
			leadId: input.leadId,
			type: input.type,
			message: input.message,
			propertyId: input.propertyId,
		},
	});

	const propertySummary = input.propertyId
		? await getPropertySummaryForAlert(input.propertyId)
		: null;

	notifyAdminLeadAction({
		action: LEAD_ADMIN_ACTIONS.INQUIRY,
		lead,
		message: input.message,
		property: propertySummary,
	});

	return inquiry;
}
