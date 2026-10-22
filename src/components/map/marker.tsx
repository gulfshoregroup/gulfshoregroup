"use client";
import { formatPrice } from "@/hooks/formatPrice";
import { RootState } from "@/state/store";
import { MarkerF } from "@react-google-maps/api";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

function MarkerItemComponent({
	item,
	handleMarkerClick,
	clusterer,
}: {
	item: any;
	handleMarkerClick: (property: any) => void;
	clusterer?: any;
}) {
	// Only re-render when THIS specific marker's highlighted status changes
	const isHighlighted = useSelector(
		(state: RootState) =>
			state.search.details?.MLSNumber === item.MLSNumber ||
			state.search.hoveredMLS === item.MLSNumber
	);

	const Latitude = parseFloat(item.Latitude);
	const Longitude = parseFloat(item.Longitude);

	const icon = useMemo(() => {
		if (typeof window === "undefined" || !window.google?.maps) return undefined;
		const displayPrice = formatPrice(
			(item.StandardStatus === "Closed" || item.MlsStatus === "Sold")
				? (item.ClosePrice || item.ListPrice)
				: item.ListPrice
		);
		const fillColor = isHighlighted ? "#B89A6A" : "#1a1a1a";
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${isHighlighted ? "130" : "120"}" height="${isHighlighted ? "70" : "60"}" viewBox="0 0 120 60"><rect x="0" y="0" width="100" height="40" rx="8" ry="8" fill="${fillColor}" stroke="white" stroke-width="1.5" /><polygon points="45,40 50,50 55,40" fill="${fillColor}" stroke="white" stroke-width="1.5" /><text x="50" y="25" font-family="Inter, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">${displayPrice}</text></svg>`;

		return {
			url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
			scaledSize: isHighlighted ? new google.maps.Size(70, 35) : new google.maps.Size(60, 30),
			anchor: new google.maps.Point(30, 30),
		};
	}, [item.StandardStatus, item.MlsStatus, item.ClosePrice, item.ListPrice, isHighlighted]);

	if (isNaN(Latitude) || isNaN(Longitude) || Latitude < 24.0 || Latitude > 31.5 || Longitude < -88.0 || Longitude > -79.5) {
		return null;
	}

	return (
		<MarkerF
			clusterer={clusterer}
			onClick={() => handleMarkerClick(item)}
			icon={icon}
			position={{
				lat: Latitude,
				lng: Longitude,
			}}
		/>
	);
}

const MarkerItem = React.memo(MarkerItemComponent);
export default MarkerItem;
