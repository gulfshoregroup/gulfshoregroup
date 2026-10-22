"use client";
import React from "react";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("./[[...slug]]/mapComponent"), {
	ssr: false,
});
import { useSearchParams } from "next/navigation";
import { SearchParamsResult } from "@/hooks/extractSearchParams";
import { parseFiltersFromSearchParams } from "@/lib/search-filters";

export default function Map({
	filterParams,
}: {
	filterParams: SearchParamsResult;
}) {
	const params = useSearchParams();
	const view = params.get("view");
	const isMapView = view === "map";
	const queryFilters = parseFiltersFromSearchParams(params);
	const effectiveFilters = {
		...filterParams,
		...queryFilters,
	};

	return isMapView ? (
		<MapComponent filterParams={effectiveFilters} />
	) : (
		<></>
	);
}
