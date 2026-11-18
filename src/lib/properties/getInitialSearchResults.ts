import "server-only";
import { NextRequest } from "next/server";
import { GET as searchPropertiesHandler } from "@/app/api/v2/properties/route";
import { EMPTY_FILTERS } from "@/lib/search-filters";

export type InitialSearchResults = {
	data: any[];
	total: number;
	totalPages: number;
};

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
			data: json.data,
			total: Number(json.total) || 0,
			totalPages: Number(json.totalPages) || 0,
		};
	} catch (error) {
		console.warn("getInitialSearchResults failed, falling back to client fetch:", error);
		return undefined;
	}
}
