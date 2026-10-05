import ExtractSearchParams, {
	SearchParamsResult,
} from "@/hooks/extractSearchParams";
import { cache } from "react";

interface MetaData {
	title: string;
	description: string;
	keywords: string;
	heading: string;
	city: string;
	community: string;
	content: {
		City?: string;
		index?: number;
		name?: string;
		featured?: boolean;
		title?: string;
		metaDescription?: string;
		infoText?: string;
		keywords?: string;
		Images?: string[];
		DefaultImage?: string;
		PropertyCount?: number;
	};
}

const fetchMetadataFromSlug = cache(async function fetchMetadataFromSlug(
	params: string[]
): Promise<MetaData> {
	try {
		const slugs = await ExtractSearchParams(params);
		let url = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_SERVER_URL || "https://gulfshoregroup.com") : "";
		if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
			url = `http://127.0.0.1:${process.env.PORT || 3000}`;
		}

		const query = new URLSearchParams(slugs as any).toString();

		const res = await fetch(
			`${url}/api/v2/metadata/search?${query}`,
			{
				headers: { Accept: "application/json" },

				next: { revalidate: 180 }, // cache + refresh every 180s
			}
		);

		if (!res.ok) {
			throw new Error("Failed to fetch metadata");
		}

		const data = (await res.json()) as MetaData;
		return data;
	} catch (error) {
		// fallback metadata
		return {
			content: {},
			city: "",
			community: "",
			heading: "Florida Real Estate Listings",
			title: "Search Condos, Homes and Vacant Land - GULFSHORE GROUP",
			description:
				"Search Condos, Homes and Vacant Land In Naples Florida and Surrounding Area. Find Latest Real Estate Properties and Listings In Naples Florida and Surrounding Area.",
			keywords:
				"SWFlorida Real-estate, Homes For Sale in Naples Florida, Homes For Sale in Southwest Florida, Southwest Florida Real Estate, Homes in Florida, Naples Real Estate",
		};
	}
});

export default fetchMetadataFromSlug;

