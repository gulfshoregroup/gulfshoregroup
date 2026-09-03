// lib/bridge.ts
const BASE_URL = process.env.BRIDGE_BASE_URL || "https://api.bridgedataoutput.com/api/v2";
const API_KEY = process.env.BRIDGE_API_KEY as string;
const SOURCE = process.env.BRIDGE_SOURCE || "nabor";

/**
 * Fetch listings that were MODIFIED on or after `date`.
 * Used for the incremental sync to catch price changes, status updates, etc.
 */
export async function fetchBridgeBatch(
	offset: number,
	limit: number,
	date: string,
	status?: string | null
) {
	let filter = `BridgeModificationTimestamp.gte=${date}`;
	if (status && status !== "All") {
		filter += `&StandardStatus.eq=${status}`;
	}

	const url =
		`${BASE_URL}/${SOURCE}/listings` +
		`?access_token=${API_KEY}` +
		`&limit=${limit}` +
		`&offset=${offset}` +
		`&${filter}`;

	const res = await fetch(url);

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Bridge API error: ${res.status}, ${url} - Response: ${errText}`);
	}

	return res.json();
}

/**
 * Fetch listings that came ON MARKET on or after `date`.
 * Used to catch brand-new listings that may have an older BridgeModificationTimestamp.
 * This is the fix for newly listed properties not appearing in the feed.
 */
export async function fetchBridgeBatchByOnMarketDate(
	offset: number,
	limit: number,
	date: string,
	status: string
) {
	const filter = `StandardStatus.eq=${status}&OnMarketDate.gte=${date}`;

	const url =
		`${BASE_URL}/${SOURCE}/listings` +
		`?access_token=${API_KEY}` +
		`&limit=${limit}` +
		`&offset=${offset}` +
		`&${filter}`;

	const res = await fetch(url);

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Bridge API error (OnMarketDate): ${res.status}, ${url} - Response: ${errText}`);
	}

	return res.json();
}

/**
 * ⚡ FULL SYNC — Fetch ALL listings with NO date filter.
 * Only filters by status (e.g. "Active").
 * Used for the one-time or periodic full sync to ensure
 * zero properties are missed regardless of timestamps.
 */
export async function fetchAllBridgeListings(
	cursorTimestamp: string | null,
	limit: number,
	status: string
) {
	let filter = `StandardStatus.eq=${status}`;
	if (cursorTimestamp) {
		filter += `&BridgeModificationTimestamp.gt=${cursorTimestamp}`;
	}

	const url =
		`${BASE_URL}/${SOURCE}/listings` +
		`?access_token=${API_KEY}` +
		`&limit=${limit}` +
		`&sortBy=BridgeModificationTimestamp&order=asc` +
		`&${filter}`;

	const res = await fetch(url);

	if (!res.ok) {
		const errText = await res.text();
		throw new Error(`Bridge API full-sync error: ${res.status} - ${errText}`);
	}

	return res.json();
}

