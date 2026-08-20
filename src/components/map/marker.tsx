"use client";
import { formatPrice } from "@/hooks/formatPrice";
import { selectUi } from "@/state/slices/searchSlice";
import { MarkerF } from "@react-google-maps/api";
import React, { useState } from "react";
import { useSelector } from "react-redux";

function MarkerItem({
	item,
	handleMarkerClick,
	clusterer,
}: {
	item: Property;
	handleMarkerClick: any;
	clusterer?: any;
}) {
	const ui = useSelector(selectUi);
	const Latitude = parseFloat(item.Latitude);
	const Longitude = parseFloat(item.Longitude);
	const isHighlighted = ui.details?.MLSNumber === item.MLSNumber || ui.hoveredMLS === item.MLSNumber;
	return (
		<div>
			<MarkerF
				clusterer={clusterer}
				onClick={() => {
					handleMarkerClick(item);
				}}
				icon={{
					url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
					  <svg xmlns="http://www.w3.org/2000/svg" width="${isHighlighted ? "130" : "120"}" height="${isHighlighted ? "70" : "60"}" viewBox="0 0 120 60">
						  <defs>
							<filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
							  <feGaussianBlur stdDeviation="2" result="blur" />
							  <feFlood flood-color="white" flood-opacity="0.3" result="glow" />
							  <feComposite in="glow" in2="blur" operator="in" result="coloredBlur" />
							  <feComposite in="SourceGraphic" in2="coloredBlur" operator="over" />
							</filter>
						  </defs>
						  <rect x="0" y="0" width="100" height="40" rx="8" ry="8" fill="${
								isHighlighted
									? "#B89A6A" // Premium Gold highlight on hover/click
									: "#1a1a1a" // Sleek black default
							}" stroke="white" stroke-width="1.5" />
						  <polygon points="45,40 50,50 55,40" fill="${
								isHighlighted
									? "#B89A6A"
									: "#1a1a1a"
							}" stroke="white" stroke-width="1.5" />
						  <text x="50" y="25" font-family="Inter, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">${formatPrice(
								((item as any).StandardStatus === "Closed" || (item as any).MlsStatus === "Sold")
									? (item.ClosePrice || item.ListPrice)
									: item.ListPrice
							)}</text>
					  </svg>
					`)}`,
					scaledSize: isHighlighted ? new google.maps.Size(70, 35) : new google.maps.Size(60, 30),
					anchor: new google.maps.Point(30, 30),
				}}
				key={item.MLSNumber}
				position={{
					lat: Latitude,
					lng: Longitude,
				}}
			/>
		</div>
	);

}

export default MarkerItem;
