"use server";
// import connectDB from "@/lib/dbconfig";
// import Property from "@/models/property";
import { SortItems } from "@/lib/constants";
import CityList from "@/data/cities";

export interface SearchParamsResult {
	city: string | null;
	developmentName: string | null;
	beds: string;
	baths: string;
	minPrice: string;
	maxPrice: string;
	builtYearMin: string;
	builtYearMax: string;
	sort: string;
	order: string;
	propertyTypes: string[];
	postalCode: string;
	page: string;
	features: string[];
	community?: string | null;
}

export default async function ExtractSearchParams(
	rawSlugs: string[] = []
): Promise<SearchParamsResult> {
	try {
		const FiltersSlugs = [
			"-beds",
			"-baths",
			"-minPrice",
			"-maxPrice",
			"-minBuiltYear",
			"-maxBuiltYear",
			"-minSqft",
			"sort=Newest-First",
			"sort=Price-High-to-Low",
			"sort=Price-Low-to-High",
			"sort=Oldest-First",
			"propertyTypes=",
			"postalCode-",
			"page-",
			"keyword-",
		];

		const slugsList = Array.isArray(rawSlugs) ? rawSlugs : [rawSlugs];
		const slugs = slugsList.map((s) => decodeURIComponent(s));

		let matchedCity: string | null = null;
		let matchedCommunity: string | null = null;
		let beds = "";
		let baths = "";
		let minPrice = "";
		let maxPrice = "";
		let builtYearMin = "";
		let builtYearMax = "";
		let sort = "";
		let order = "";
		let propertyTypes: string[] = [];
		let postalCode = "";
		let page = "";
		let features: string[] = [];

		const PropertyTypes = ["Homes", "Residential-Lots", "Condos"];

		// Separate content slugs
		const contentSlugs = slugs.filter(
			(slug) =>
				!FiltersSlugs.some(
					(filter) =>
						slug.endsWith(filter) ||
						slug.startsWith(filter) ||
						filter === slug
				)
		);

		const Filters = slugs.filter((slug) =>
			FiltersSlugs.some(
				(filter) =>
					slug.endsWith(filter) ||
					slug.startsWith(filter) ||
					filter === slug
			)
		);

		if (contentSlugs.length) {
			// Check property types
			for (const slug of contentSlugs) {
				if (PropertyTypes.includes(slug)) {
					propertyTypes.push(slug);
				}
			}

			const areaSlugs = contentSlugs.filter(
				(slug) => !PropertyTypes.includes(slug)
			);

			if (areaSlugs.length) {
				const formattedSlugs = areaSlugs.map((s) =>
					s
						.replaceAll(/[^a-zA-Z0-9&]+/g, " ")
						.trim()
						.toUpperCase()
				);
				const UpperCityList = CityList.map((c) => c.toUpperCase());
				if (formattedSlugs.length > 1) {
					if (UpperCityList.includes(formattedSlugs[0])) {
						matchedCity = formattedSlugs[0] || null;
						matchedCommunity = formattedSlugs[1] || null;
					} else if (UpperCityList.includes(formattedSlugs[1])) {
						matchedCity = formattedSlugs[1] || null;
					}
				} else {
					if (UpperCityList.includes(formattedSlugs[0])) {
						matchedCity = formattedSlugs[0] || null;
					}
				}
			}
		}

		// Parse filters
		for (const part of Filters) {
			const slug = decodeURIComponent(part);
			if (slug.endsWith("-beds")) beds = slug.replace("-beds", "");
			else if (slug.endsWith("-baths"))
				baths = slug.replace("-baths", "");
			else if (slug.endsWith("-minPrice"))
				minPrice = slug.replace("-minPrice", "");
			else if (slug.endsWith("-maxPrice"))
				maxPrice = slug.replace("-maxPrice", "");
			else if (slug.endsWith("-minBuiltYear"))
				builtYearMin = slug.replace("-minBuiltYear", "");
			else if (slug.endsWith("-maxBuiltYear"))
				builtYearMax = slug.replace("-maxBuiltYear", "");
			else if (slug.startsWith("sort=")) {
				const sortValue = slug.replace("sort=", "");
				const sortItem = SortItems.find(
					(item) => item.label.replaceAll(" ", "-") === sortValue
				);
				sort = sortItem?.sort || "";
				order = sortItem?.order || "";
			} else if (slug.startsWith("propertyTypes=")) {
				const types = slug.replace("propertyTypes=", "").split(",");
				propertyTypes.push(...types);
			} else if (slug.startsWith("postalCode-"))
				postalCode = slug.replace("postalCode-", "");
			else if (slug.startsWith("page-"))
				page = slug.replace("page-", "");
			else if (slug.startsWith("keyword-")) {
				const keyword = slug.replace("keyword-", "");
				if (keyword === "waterfront") features.push("waterfront");
				else if (keyword === "spa") features.push("spa");
				else if (keyword === "pool") features.push("pool");
				else if (keyword === "gulfaccess")
					features.push("gulfaccess");
			}
		}

		// Deduplicate property types
		propertyTypes = [...new Set(propertyTypes)];

		return {
			city: matchedCity || "",
			developmentName: matchedCommunity || "",
			beds,
			baths,
			minPrice,
			maxPrice,
			builtYearMin,
			builtYearMax,
			sort,
			order,
			propertyTypes,
			postalCode,
			page,
			features,
		};
	} catch (error) {
		console.error("Error in ExtractSearchParams:", error);
		return {
			city: null,
			developmentName: null,
			beds: "",
			baths: "",
			minPrice: "",
			maxPrice: "",
			builtYearMin: "",
			builtYearMax: "",
			sort: "",
			order: "",
			propertyTypes: [],
			postalCode: "",
			page: "",
			features: [],
		};
	}
}
