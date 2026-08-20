import type { Filters } from "@/types/search";

export class LeadAuthRequiredError extends Error {
	constructor() {
		super("Authentication required");
		this.name = "LeadAuthRequiredError";
	}
}

type ApiSuccess<T> = { success: true; data: T; meta?: Record<string, unknown> };
type ApiFailure = { success: false; error: string };

async function leadRequest<T>(
	path: string,
	options?: RequestInit
): Promise<ApiSuccess<T>> {
	const headers = new Headers(options?.headers);
	if (options?.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	const response = await fetch(path, {
		...options,
		credentials: "same-origin",
		headers,
	});

	const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;

	if (response.status === 401) {
		throw new LeadAuthRequiredError();
	}

	if (!response.ok || payload.success === false) {
		throw new Error(
			"error" in payload ? payload.error : "Request failed"
		);
	}

	return payload;
}

/** Map Redux search filters to the lead API search payload shape. */
export function mapFiltersToLeadSearch(
	filters: Filters
): Record<string, unknown> {
	return {
		location: filters.city || filters.developmentName || undefined,
		city: filters.city || undefined,
		community: filters.developmentName || undefined,
		minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
		maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
		propertyType: filters.propertyTypes?.length
			? filters.propertyTypes.join(", ")
			: undefined,
		bedrooms: filters.beds ? Number(filters.beds) : undefined,
		bathrooms: filters.baths ? Number(filters.baths) : undefined,
		postalCode: filters.postalCode || undefined,
		features: filters.features?.length ? filters.features : undefined,
		sort: filters.sort || undefined,
		order: filters.order || undefined,
	};
}

export async function trackPropertyView(propertyId: string) {
	return leadRequest<unknown>("/api/leads/viewed-property", {
		method: "POST",
		body: JSON.stringify({ propertyId }),
	});
}

export async function saveSearchHistory(
	filters: Record<string, unknown>,
	resultCount?: number
) {
	if (typeof document !== "undefined" && !document.cookie.includes("__session") && !document.cookie.includes("mock_signed_in=true")) {
		throw new LeadAuthRequiredError();
	}
	return leadRequest<unknown>("/api/leads/search-history", {
		method: "POST",
		body: JSON.stringify({ filters, resultCount }),
	});
}

export async function addToWishlist(propertyId: string) {
	return leadRequest<{ item: unknown; created: boolean }>(
		"/api/leads/wishlist",
		{
			method: "POST",
			body: JSON.stringify({ propertyId }),
		}
	);
}

export async function removeFromWishlist(propertyId: string) {
	return leadRequest<unknown>(`/api/leads/wishlist/${propertyId}`, {
		method: "DELETE",
	});
}

export async function checkWishlist(propertyId: string) {
	if (typeof document !== "undefined" && !document.cookie.includes("__session") && !document.cookie.includes("mock_signed_in=true")) {
		return { success: true as const, data: { saved: false } };
	}
	return leadRequest<{ saved: boolean }>(
		`/api/leads/wishlist/check/${propertyId}`
	);
}

export async function getWishlist(page = 1, limit = 100) {
	const params = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		sortBy: "createdAt",
		sortOrder: "desc",
	});
	return leadRequest<unknown[]>(`/api/leads/wishlist?${params.toString()}`);
}

export async function createSavedSearch(input: {
	name?: string;
	filters: Record<string, unknown>;
	frequency?: "Instant" | "Daily" | "Weekly";
	notify?: boolean;
}) {
	return leadRequest<unknown>("/api/leads/saved-search", {
		method: "POST",
		body: JSON.stringify(input),
	});
}
