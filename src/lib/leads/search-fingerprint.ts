import { createHash } from "crypto";
import type { SearchFiltersInput } from "@/lib/leads/validation";

function sortObject(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(sortObject);
	}
	if (value && typeof value === "object") {
		return Object.keys(value as Record<string, unknown>)
			.sort()
			.reduce<Record<string, unknown>>((acc, key) => {
				acc[key] = sortObject((value as Record<string, unknown>)[key]);
				return acc;
			}, {});
	}
	return value;
}

export function buildSearchFingerprint(filters: SearchFiltersInput): string {
	const normalized = sortObject(filters);
	return createHash("sha256")
		.update(JSON.stringify(normalized))
		.digest("hex");
}

export function normalizeSearchFilters(
	filters: SearchFiltersInput
): SearchFiltersInput {
	return {
		...filters,
		query: filters.query?.trim() || undefined,
		location: filters.location?.trim() || undefined,
		city: filters.city?.trim() || undefined,
		community: filters.community?.trim() || undefined,
		postalCode: filters.postalCode?.trim() || undefined,
		propertyType: filters.propertyType?.trim() || undefined,
		propertySubType: filters.propertySubType?.trim() || undefined,
	};
}
