import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api/errors";
import {
	buildPaginatedResult,
	type PaginatedResult,
} from "@/lib/api/pagination";
import { PROPERTY_SUMMARY_SELECT } from "@/lib/leads/constants";
import {
	getPropertySummaryForAlert,
	LEAD_ADMIN_ACTIONS,
	notifyAdminLeadAction,
} from "@/lib/leads/admin-notify";

type ListWishlistOptions = {
	leadId: string;
	page: number;
	limit: number;
	sortBy: "createdAt";
	sortOrder: "asc" | "desc";
};

export async function addToWishlist(leadId: string, propertyId: string) {
	const property = await prisma.property.findUnique({
		where: { id: propertyId },
		select: { id: true, ListPrice: true },
	});

	if (!property) {
		throw new ApiError(404, "Property not found", "PROPERTY_NOT_FOUND");
	}

	const existing = await prisma.savedProperty.findUnique({
		where: {
			leadId_propertyId: { leadId, propertyId },
		},
		include: {
			property: { select: PROPERTY_SUMMARY_SELECT },
		},
	});

	if (existing) {
		return { item: existing, created: false };
	}

	const lead = await prisma.lead.findUnique({
		where: { id: leadId },
		select: {
			id: true,
			email: true,
			fullName: true,
			firstName: true,
			lastName: true,
		},
	});

	const item = await prisma.savedProperty.create({
		data: {
			leadId,
			propertyId,
			lastNotifiedPrice: property.ListPrice ?? 0,
		},
		include: {
			property: { select: PROPERTY_SUMMARY_SELECT },
		},
	});

	if (lead) {
		const propertySummary = await getPropertySummaryForAlert(propertyId);
		notifyAdminLeadAction({
			action: LEAD_ADMIN_ACTIONS.SAVE_PROPERTY,
			lead,
			property: propertySummary,
		});
	}

	return { item, created: true };
}

export async function removeFromWishlist(leadId: string, propertyId: string) {
	const existing = await prisma.savedProperty.findUnique({
		where: {
			leadId_propertyId: { leadId, propertyId },
		},
	});

	if (!existing) {
		throw new ApiError(
			404,
			"Property not found in wishlist",
			"WISHLIST_ITEM_NOT_FOUND"
		);
	}

	await prisma.savedProperty.delete({ where: { id: existing.id } });
	return { propertyId };
}

export async function isPropertyWishlisted(
	leadId: string,
	propertyId: string
): Promise<{ saved: boolean }> {
	const existing = await prisma.savedProperty.findUnique({
		where: {
			leadId_propertyId: { leadId, propertyId },
		},
		select: { id: true },
	});

	return { saved: Boolean(existing) };
}

export async function listWishlist(
	options: ListWishlistOptions
): Promise<PaginatedResult<unknown>> {
	const { leadId, page, limit, sortBy, sortOrder } = options;
	const skip = (page - 1) * limit;
	const where = { leadId };

	const [total, items] = await prisma.$transaction([
		prisma.savedProperty.count({ where }),
		prisma.savedProperty.findMany({
			where,
			orderBy: { [sortBy]: sortOrder },
			skip,
			take: limit,
			include: {
				property: { select: PROPERTY_SUMMARY_SELECT },
			},
		}),
	]);

	return buildPaginatedResult(items, total, page, limit);
}
