"use client";
import {
	selectUi,
	syncGuestSearch,
	syncRecentViews,
} from "@/state/slices/searchSlice";
import { useAppDispatch } from "@/state/store";
import { Filters } from "@/types/search";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { trackPropertyView } from "@/lib/leads/client";

//Property
//view History = guest user
//recently Viewed = logged in user

//Search
//prevSearches = guest user
//searchHistory = logged in user

/**
 * Tracks a property view for signed-in users only.
 * Calls POST /api/leads/viewed-property once per page visit.
 */
export function useTrackViewedProperty(propertyId: string) {
	const trackedRef = useRef(false);

	useEffect(() => {
		if (!propertyId || trackedRef.current) {
			return;
		}

		trackedRef.current = true;

		trackPropertyView(propertyId).catch((error) => {
			console.error("[trackViewedProperty]", error);
			trackedRef.current = false;
		});
	}, [propertyId]);
}

export function TrackSearches() {
	if (process.env.NEXT_PUBLIC_ENV === "DEV") return;
	if (typeof window === "undefined") return;

	const ui = useSelector(selectUi);
	const { isLoaded, isSignedIn } = useAuth();

	const filters = ui.filters;
	if (isLoaded) {
		if (isSignedIn && filters) {
			const prev = JSON.parse(
				localStorage.getItem("prevSearches") || "[]"
			);

			const exists = prev.some(
				(item: Filters) =>
					JSON.stringify(item) === JSON.stringify(filters)
			);

			if (!exists) {
				prev.push(filters);
				localStorage.setItem("prevSearches", JSON.stringify(prev));
			}
			syncGuestSearchHistory();
		} else {
			const path = usePathname();

			const prev = JSON.parse(
				localStorage.getItem("searchHistory") || "[]"
			);

			const exists = prev.some((item: string) => item === path);

			if (!exists) {
				prev.push(path);
				localStorage.setItem("searchHistory", JSON.stringify(prev));
			}
		}
	}
}

export function trackViewedProperty(id: string) {
	if (process.env.NEXT_PUBLIC_ENV === "DEV") return;

	const dispatch = useAppDispatch();
	if (typeof window !== "undefined") {
		const { isLoaded, isSignedIn } = useAuth();

		if (isLoaded) {
			if (isSignedIn) {
				const previous: string[] = JSON.parse(
					localStorage.getItem("recentlyViewed") || "[]"
				);
				if (previous.includes(id)) return;
				previous.push(id);
				localStorage.setItem(
					"recentlyViewed",
					JSON.stringify(previous)
				);
				dispatch(syncRecentViews(id));
				syncGuestViewedProperty();
			}

			const previous: string[] = JSON.parse(
				localStorage.getItem("viewHistory") || "[]"
			);

			if (previous.includes(id)) return;

			previous.push(id);
			localStorage.setItem("viewHistory", JSON.stringify(previous));

			if (previous.length >= 3) {
				const currentPath = window.location.pathname;
				window.location.href = `/signup?redirect_url=${encodeURIComponent(currentPath)}`;
			}
		}
	}
}

function syncGuestViewedProperty() {
	const dispatch = useAppDispatch();
	const previous: string[] = JSON.parse(
		localStorage.getItem("viewHistory") || "[]"
	);
	if (previous.length) {
		previous.forEach((item) => dispatch(syncRecentViews(item)));
		localStorage.removeItem("viewHistory");
	} else {
		return;
	}
}

function syncGuestSearchHistory() {
	const dispatch = useAppDispatch();
	const previous: string[] = JSON.parse(
		localStorage.getItem("searchHistory") || "[]"
	);
	if (previous.length) {
		previous.forEach((item) => {
			dispatch(syncGuestSearch(item));
		});

		localStorage.removeItem("searchHistory");
	} else {
		return;
	}
}
