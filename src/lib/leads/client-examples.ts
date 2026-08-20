/**
 * Example frontend integration for lead CRM APIs.
 * All requests require an authenticated Clerk session (cookies sent automatically).
 */

const API_BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "";

async function parseJson<T>(response: Response): Promise<T> {
	const payload = await response.json();
	if (!response.ok || payload.success === false) {
		throw new Error(payload.error ?? "Request failed");
	}
	return payload as T;
}

/** Track a property view (call when property detail page loads). */
export async function trackPropertyView(propertyId: string) {
	const response = await fetch(`${API_BASE}/api/leads/viewed-property`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ propertyId }),
	});
	return parseJson<{ success: true; data: unknown }>(response);
}

/** Fetch recently viewed properties with pagination. */
export async function getRecentlyViewed(page = 1, limit = 20) {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		sortBy: "lastViewedAt",
		sortOrder: "desc",
	});
	const response = await fetch(
		`${API_BASE}/api/leads/viewed-property?${params.toString()}`
	);
	return parseJson<{ success: true; data: unknown[]; meta: unknown }>(
		response
	);
}

/** Save search history after a user runs a search. */
export async function saveSearchHistory(filters: Record<string, unknown>, resultCount?: number) {
	const response = await fetch(`${API_BASE}/api/leads/search-history`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ filters, resultCount }),
	});
	return parseJson<{ success: true; data: unknown }>(response);
}

/** Add property to wishlist. */
export async function addToWishlist(propertyId: string) {
	const response = await fetch(`${API_BASE}/api/leads/wishlist`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ propertyId }),
	});
	return parseJson<{ success: true; data: unknown }>(response);
}

/** Remove property from wishlist. */
export async function removeFromWishlist(propertyId: string) {
	const response = await fetch(
		`${API_BASE}/api/leads/wishlist/${propertyId}`,
		{ method: "DELETE" }
	);
	return parseJson<{ success: true; data: unknown }>(response);
}

/** Check if a property is saved. */
export async function checkWishlist(propertyId: string) {
	const response = await fetch(
		`${API_BASE}/api/leads/wishlist/check/${propertyId}`
	);
	return parseJson<{ success: true; data: { saved: boolean } }>(response);
}

/** Create a saved search with notification preferences. */
export async function createSavedSearch(input: {
	name?: string;
	filters: Record<string, unknown>;
	frequency?: "Instant" | "Daily" | "Weekly";
	notify?: boolean;
}) {
	const response = await fetch(`${API_BASE}/api/leads/saved-search`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return parseJson<{ success: true; data: unknown }>(response);
}

/** Update saved search notification settings. */
export async function updateSavedSearch(
	id: string,
	patch: {
		name?: string;
		filters?: Record<string, unknown>;
		frequency?: "Instant" | "Daily" | "Weekly";
		notify?: boolean;
	}
) {
	const response = await fetch(`${API_BASE}/api/leads/saved-search/${id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(patch),
	});
	return parseJson<{ success: true; data: unknown }>(response);
}
