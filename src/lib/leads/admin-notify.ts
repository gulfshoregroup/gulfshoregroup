import prisma from "@/lib/prisma";
import { LEAD_ADMIN_ACTIONS } from "@/lib/leads/constants";
import {
	sendAdminLeadAlertEmail,
} from "@/lib/email/admin-lead-alert";
import type { AdminLeadAlertPayload } from "@/lib/leads/types";
import type { Lead } from "@/app/generated/prisma/client";

type NotifyOptions = Omit<
	AdminLeadAlertPayload,
	"leadName" | "leadEmail" | "timestamp"
> & {
	lead: Pick<Lead, "fullName" | "firstName" | "lastName" | "email">;
	timestamp?: Date;
};

function resolveLeadName(
	lead: Pick<Lead, "fullName" | "firstName" | "lastName" | "email">
): string {
	return (
		lead.fullName ||
		[lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
		lead.email
	);
}

/**
 * Fire-and-forget admin notification. Never throws — logs failures instead.
 */
export function notifyAdminLeadAction(options: NotifyOptions): void {
	const payload: AdminLeadAlertPayload = {
		action: options.action,
		leadName: resolveLeadName(options.lead),
		leadEmail: options.lead.email,
		timestamp: options.timestamp ?? new Date(),
		message: options.message,
		property: options.property,
		searchName: options.searchName,
		filters: options.filters,
	};

	void sendAdminLeadAlertEmail(payload).then((result) => {
		if (!result.ok) {
			console.error("[Admin Alert Email]", result.error);
		}
	});
}

export async function getPropertySummaryForAlert(propertyId: string) {
	return prisma.property.findUnique({
		where: { id: propertyId },
		select: {
			id: true,
			ListingId: true,
			MLSNumber: true,
			FullAddress: true,
			City: true,
			StateOrProvince: true,
			PostalCode: true,
			ListPrice: true,
			PropertyType: true,
		},
	});
}

export { LEAD_ADMIN_ACTIONS };
