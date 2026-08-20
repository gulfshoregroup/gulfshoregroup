import axios from "axios";
import {
	LeadAuthRequiredError,
	mapFiltersToLeadSearch,
	saveSearchHistory,
	trackPropertyView,
} from "@/lib/leads/client";
import { Filters, UiState } from "@/types/search";
import qs from "qs";

export async function fetchPropertiesApi({
	filters,
	limit,
}: {
	filters: Filters;
	limit: number;
}) {
	const baseUrl =
		typeof window !== "undefined"
			? ""
			: process.env.NEXT_PUBLIC_SERVER_URL || "";

	try {
		const res = await axios.get(`${baseUrl}/api/v2/properties`, {
			params: {
				...filters,
				limit,
			},
		});

		await syncSearchToDb(filters, res.data?.total ?? undefined);

		return res.data;
	} catch (error) {
		throw error;
	}
}

export function createQsFromState({ ui }: { ui: UiState }) {
	return qs.stringify(
		{
			success: ui.success,
			listview: ui.listView,
			mobileMapView: ui.mobileMapView,
			list: ui.list,
			total: ui.total,
			totalPages: ui.totalPages,
			details: ui.details,
			loading: ui.loading,
			error: ui.error,
			filters: ui.filters,
		},
		{ skipNulls: true }
	);
}

/** Persist search history for signed-in users only. */
export async function syncSearchToDb(
	filters: Filters,
	resultCount?: number
) {
	// Client-side guard to prevent redundant 401 logs for guest users
	if (typeof document !== "undefined" && !document.cookie.includes("__session")) {
		return null;
	}

	try {
		await saveSearchHistory(
			mapFiltersToLeadSearch(filters),
			resultCount
		);
	} catch (error) {
		if (error instanceof LeadAuthRequiredError) {
			return null;
		}
		return null;
	}
}

/** Track viewed property for signed-in users only. */
export async function syncRecentViewsToDB(propertyId: string) {
	// Client-side guard to prevent redundant 401 logs for guest users
	if (typeof document !== "undefined" && !document.cookie.includes("__session")) {
		return null;
	}

	try {
		await trackPropertyView(propertyId);
	} catch (error) {
		if (error instanceof LeadAuthRequiredError) {
			return null;
		}
		return null;
	}
}
