export interface SearchParams {
	beds?: string;
	baths?: string;
	minPrice?: string;
	maxPrice?: string;
	builtYear?: string;
	propertyType?: string[];
	city?: string;
	mlsNumber?: string;
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
	{
		id: 3,
		label: "Oldest First",
		order: "asc",
		sort: "CreatedDate",
	},
	{
		id: 4,
		label: "🆕 New Launch",
		order: "desc",
		sort: "OnMarketDate",
	},
] as const;

export type SortItem = (typeof SortItems)[number];
