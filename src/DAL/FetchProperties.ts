import "server-only";
import axios from "axios";
import { cache } from "react";
import { NextRequest } from "next/server";
import { GET as getPropertyHandler } from "@/app/api/v2/properties/[property]/route";

export default async function FetchProperties(params: string[]) {
	const paramsString = params.join("&");
	try {
		const response = await axios.get(`/api/properties?${paramsString}`);
		if (response.data.success) {
			return response.data;
		}
	} catch (error) {
		return;
	}
}

/**
 * Load one listing for the listing page (metadata + page share this via
 * React `cache`, so it runs once per request).
 *
 * Previously this did `fetch("https://gulfshoregroup.com/api/v2/properties/…")`
 * — the server calling itself over the public internet (DNS + TLS + proxy on
 * every uncached page view). Now it runs the same route handler in-process,
 * keeping its memory/Redis caching, geocoding fallback and lease filtering.
 *
 * Returns undefined when the listing doesn't exist (page shows a 404).
 * Throws on server/DB errors so the page returns 500 (Google retries later)
 * instead of a 404 that would get the listing dropped from the index.
 */
export const FetchProperty = cache(async (params: string) => {
	const slug = decodeURIComponent(params || "");
	if (!slug) return undefined;

	const res = await getPropertyHandler(
		new NextRequest(`http://internal/api/v2/properties/${encodeURIComponent(slug)}`),
		{ params: Promise.resolve({ property: slug }) }
	);

	if (res.status === 404) return undefined;
	if (!res.ok) throw new Error(`Property ${slug} failed to load (${res.status})`);

	const response = await res.json();
	return response?.success ? response.data : undefined;
});
