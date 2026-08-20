import type { LeadAdminActionType } from "@/lib/leads/constants";

export type PropertySummary = {
	id: string;
	ListingId: string;
	MLSNumber: string;
	FullAddress: string;
	City: string;
	StateOrProvince: string | null;
	PostalCode: string | null;
	ListPrice: number | null;
	PropertyType: string | null;
};

export type AdminLeadAlertPayload = {
	action: LeadAdminActionType;
	leadName: string;
	leadEmail: string;
	timestamp: Date;
	message?: string;
	property?: PropertySummary | null;
	searchName?: string;
	filters?: Record<string, unknown>;
};

export type TrackViewedPropertyResult = {
	id: string;
	propertyId: string;
	viewCount: number;
	viewedAt: Date;
	lastViewedAt: Date;
	isNewView: boolean;
};
