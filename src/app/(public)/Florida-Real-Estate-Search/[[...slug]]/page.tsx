import ExtractSearchParams from "@/hooks/extractSearchParams";
import MapViewList from "./mapViewList";
import React from "react";
import { parseFiltersFromQuery } from "@/lib/search-filters";
import CityFAQ from "@/components/city/city-faq";
import GetSeoData from "@/hooks/getSeoData";
import capitalizeWords from "@/hooks/capitalize-letter";
import { getInitialSearchResults } from "@/lib/properties/getInitialSearchResults";
import { correctedSearchPath } from "@/lib/seo/area-path";
import { permanentRedirect } from "next/navigation";

export default async function ListingsPage({
	params,
	searchParams,
}: {
	params: Promise<{
		slug?: string[];
	}>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const slug = (await params).slug || [];
	const sp = await searchParams;

	// /NAPLES, /naples, /bonita-springs -> permanent redirect to /Naples,
	// /Bonita-Springs, so Google sees ONE URL per city/community.
	// Property types (Homes, Condos) and filter segments are never touched.
	const correctedPath = correctedSearchPath(slug);
	if (correctedPath) {
		const qs = new URLSearchParams();
		for (const [k, v] of Object.entries(sp)) {
			if (Array.isArray(v)) v.forEach((x) => qs.append(k, x));
			else if (v !== undefined) qs.append(k, v);
		}
		const query = qs.toString();
		permanentRedirect(query ? `${correctedPath}?${query}` : correctedPath);
	}
	const view = typeof sp.view === "string" ? sp.view : undefined;
	const filterFromSlug = await ExtractSearchParams(slug);
	const filterFromQuery = parseFiltersFromQuery(sp);
	const filter = {
		...filterFromSlug,
		...filterFromQuery,
		propertyTypes:
			filterFromQuery.propertyTypes ?? filterFromSlug.propertyTypes,
		features: filterFromQuery.features ?? filterFromSlug.features,
		page: filterFromQuery.page ?? filterFromSlug.page ?? "1",
	};

	// SEO data and the first page of listings load in parallel on the server.
	const [seoData, initialData] = await Promise.all([
		GetSeoData({ params: filterFromSlug }).catch((error: any) => {
			console.error("Error fetching SEO data:", error);
			return undefined;
		}),
		view === "map" ? Promise.resolve(undefined) : getInitialSearchResults(filter),
	]);

	let heading = seoData?.heading;
	
	const searchKeyword = filter.developmentName || filter.city || filter.q || filter.subdivision || filter.school;
	if (sp.utm_source === "sms_alert" || sp.utm_source === "email_alert" || filter.daysOld) {
		heading = searchKeyword
			? `New Matches in ${capitalizeWords(searchKeyword as string)}, FL (Last 24 Hours)`
			: "Your New Property Matches (Last 24 Hours)";
	} else if (searchKeyword) {
		const cleanHeadingKeyword = (searchKeyword as string).replace(/,\s*(fl|florida)\b/gi, "").trim();
		heading = `Listings in ${capitalizeWords(cleanHeadingKeyword)}, FL`;
	} else if (!heading) {
		heading = "Listings in Florida and Surrounding Area";
	}

	return (
		<>
			<MapViewList
				filter={filter}
				view={view === "map" ? "map" : "list"}
				heading={heading}
				initialData={initialData}
			/>
			<CityFAQ city={filter.city} />
		</>
	);
}
