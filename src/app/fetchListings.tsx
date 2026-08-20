import axios from "axios";
import ExtractSearchParams from "@/hooks/extractSearchParams";

export interface SearchFilters {
	beds?: string;
	baths?: string;
	minPrice?: string;
	maxPrice?: string;
	builtYearMin?: string;
	builtYearMax?: string;
	propertyTypes?: string[];
	city?: string;
	postalCode?: string;
	mlsNumber?: string;
	developmentName?: string;
	page?: number;
}

export const SortItems = [
	{
		id: 0,
		label: "Newest First",
		order: "desc",
		sort: "CreatedDate",
	},
	{
		id: 1,
		label: "Price High to Low",
		order: "desc",
		sort: "CurrentPrice",
	},
	{
		id: 2,
		label: "Price Low to High",
		order: "asc",
		sort: "CurrentPrice",
	},
	{ id: 3, label: "Oldest First", order: "asc", sort: "CreatedDate" },
] as const;

export type SortItem = (typeof SortItems)[number];

export async function useSearchFilters(slugs: string[]) {
	const parts = slugs;
	const filters = await ExtractSearchParams(parts);

	const url = process.env.NEXT_PUBLIC_SERVER_URL || "https://gulfshoregroup.com";
	const res = await axios.get(`${url}/api/v2/properties`, {
		params: {
			...filters,
			limit: 24,
		},
	});

	return {
		filters,
		properties: res.data.data,
		total: res.data.total,
		totalPages: res.data.totalPages,
		page: res.data.page,
	};
}
