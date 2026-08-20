export const LEAD_ADMIN_ACTIONS = {
	SIGNUP: "signup",
	SAVE_PROPERTY: "save_property",
	INQUIRY: "inquiry",
	SAVE_SEARCH: "save_search",
} as const;

export type LeadAdminActionType =
	(typeof LEAD_ADMIN_ACTIONS)[keyof typeof LEAD_ADMIN_ACTIONS];

/** Dedupe identical searches within this window (milliseconds) */
export const SEARCH_HISTORY_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

export const VIEWED_PROPERTY_SORT_FIELDS = [
	"lastViewedAt",
	"viewedAt",
	"viewCount",
] as const;

export const SEARCH_HISTORY_SORT_FIELDS = ["createdAt", "updatedAt"] as const;

export const SAVED_SEARCH_SORT_FIELDS = ["createdAt", "updatedAt"] as const;

export const WISHLIST_SORT_FIELDS = ["createdAt"] as const;

export const PROPERTY_SUMMARY_SELECT = {
	id: true,
	ListingId: true,
	MLSNumber: true,
	FullAddress: true,
	City: true,
	Community: true,
	StateOrProvince: true,
	PostalCode: true,
	ListPrice: true,
	PropertyType: true,
	PropertySubType: true,
	BedroomsTotal: true,
	BathroomsTotalInteger: true,
	BathroomsFull: true,
	LivingArea: true,
	YearBuilt: true,
	LotSizeAcres: true,
	MandatoryHOAYN: true,
	HOAFee: true,
	HOAFeeFreq: true,
	ListOfficeName: true,
	images: true,
} as const;
