import "server-only";
import { NextRequest } from "next/server";
import { GET as searchPropertiesHandler } from "@/app/api/v2/properties/route";
import { EMPTY_FILTERS } from "@/lib/search-filters";

export type InitialSearchResults = {
	data: any[];
	total: number;
	totalPages: number;
};

// Fields read by PropertyCard / CardCarousel (+ ids used by map/wishlist).
// Everything else (descriptions, agent contacts, 30-60 photos per listing)
// was being serialized into the page HTML for 36 listings (~370 KB).
const CARD_FIELDS = [
	"id", "ListingId", "ListingKey", "MLSNumber", "Community", "Development",
	"StandardStatus", "MlsStatus", "StatusType", "OnMarketDate", "OnMarketTimestamp",
	"ListPrice", "ClosePrice", "OriginalListPrice",
	"City", "StateOrProvince", "PostalCode", "FullAddress",
	"PropertyType", "PropertySubType", "BedroomsTotal", "BathroomsFull", "BathroomsHalf",
	"BathroomsTotalDecimal", "LivingArea", "YearBuilt", "LotSizeAcres",
	"Latitude", "Longitude", "WaterfrontYN", "PoolPrivateYN", "SpaYN", "GulfAccessYN",
	"HOAFee", "HOAFeeFreq", "MasterHOAFee", "MasterHOAFeeFreq", "MandatoryHOAYN",
	"ListOfficeName", "isWishlisted",
	"VirtualTourURLBranded", "VirtualTourURLUnbranded", // map details panel
];
const MAX_CARD_PHOTOS = 8; // CardCarousel shows at most 8

function slimForCard(p: any) {
	const out: any = {};
	for (const k of CARD_FIELDS) if (p[k] !== undefined) out[k] = p[k];
	out.images = Array.isArray(p.images) ? p.images.slice(0, MAX_CARD_PHOTOS) : p.images;
	return out;
}

export const SEARCH_PAGE_LIMIT = 36; // must match `limit` in state/slices/searchSlice.ts

/**
 * Server-side first page of search results for city / community pages.
 *
 * Runs the exact same handler as GET /api/v2/properties, but in-process (no
 * HTTP round trip), so the listings are in the server-rendered HTML. That
 * makes them visible to Google and to AI crawlers (GPTBot, ClaudeBot,
 * PerplexityBot) that do not run JavaScript, and removes the skeleton ->
 * results swap that delayed LCP and caused layout shift.
 *
 * Query params are serialised the same way axios does in the browser
 * (arrays as `key[]`), so the server and browser share the same cache keys.
 */
export async function getInitialSearchResults(
	filter: Record<string, any>
): Promise<InitialSearchResults | undefined> {
	try {
		const merged: Record<string, any> = { ...EMPTY_FILTERS, ...filter, limit: SEARCH_PAGE_LIMIT };
		const qs = new URLSearchParams();
		for (const [key, value] of Object.entries(merged)) {
			if (value === null || value === undefined) continue;
			if (Array.isArray(value)) {
				for (const v of value) qs.append(`${key}[]`, String(v));
			} else {
				qs.append(key, String(value));
			}
		}

		const req = new NextRequest(`http://internal/api/v2/properties?${qs.toString()}`);
		const res = await searchPropertiesHandler(req);
		if (!res.ok) return undefined;
		const json = await res.json();
		if (!json?.success || !Array.isArray(json.data)) return undefined;

		return {
			data: json.data.map(slimForCard),
			total: Number(json.total) || 0,
			totalPages: Number(json.totalPages) || 0,
		};
	} catch (error) {
		console.warn("getInitialSearchResults failed, falling back to client fetch:", error);
		return undefined;
	}
}
