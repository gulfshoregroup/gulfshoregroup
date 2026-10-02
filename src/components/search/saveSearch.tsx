"use client";

import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
	createSavedSearch,
	LeadAuthRequiredError,
	mapFiltersToLeadSearch,
} from "@/lib/leads/client";
import { RootState } from "@/state/store";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { parseLocationFromPathname } from "@/lib/search-filters";

export default function SaveSearchButton() {
	const { filters } = useSelector((state: RootState) => state.search);
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();
    const pathname = usePathname();
	const [loading, setLoading] = useState(false);

	const buildSearchName = (activeFilters: any) => {
		if (activeFilters.city || activeFilters.propertyTypes.length > 0) {
			return `${activeFilters.city || ""} ${activeFilters.propertyTypes.join(", ")}`.trim();
		}
		return "My Saved Search";
	};

	const handleSaveSearch = async () => {
		if (!isLoaded) return;

		if (!isSignedIn) {
			toast.info("Sign in to save searches", {
				description: "Create an account or log in to save this search.",
			});
			router.push("/signup");
			return;
		}

		try {
			setLoading(true);

            // Extract location from URL in case Redux missed it from direct navigation
            const location = parseLocationFromPathname(pathname);
            
            const fullFilters = {
                ...filters,
                city: filters.city || location.city,
                developmentName: filters.developmentName || location.developmentName,
            };

			await createSavedSearch({
				name: buildSearchName(fullFilters),
				filters: mapFiltersToLeadSearch(fullFilters),
				frequency: "Daily",
				notify: true,
			});

			toast.success("Search saved!", {
				description:
					"You will receive notifications when new listings match.",
			});
		} catch (error) {
			if (error instanceof LeadAuthRequiredError) {
				toast.info("Sign in to save searches");
				router.push("/signup");
			} else {
				toast.error("Failed to save search. Please try again.");
				console.error(error);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button
			onClick={handleSaveSearch}
			disabled={loading || !isLoaded}
			className="bg-blue-600 hover:bg-blue-700 text-white rounded-md">
			{loading ? "Saving..." : "Save Search"}
		</Button>
	);
}
