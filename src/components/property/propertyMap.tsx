"use client";

import React, { useRef, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { Layers, ChevronDown } from "lucide-react";

interface PropertyMapProps {
	property: any;
	Latitude: number;
	Longitude: number;
}

const mapContainerStyle = {
	height: "50vh",
	minHeight: "400px",
	width: "100%",
	borderRadius: "0.75rem",
	border: "1px solid #e2e8f0",
	overflow: "hidden",
};

export default function PropertyMap({ property, Latitude, Longitude }: PropertyMapProps) {
	const [mapTypeId, setMapTypeId] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("hybrid");
	const [streetViewActive, setStreetViewActive] = useState(false);
	const [showFema, setShowFema] = useState(false);
	const [femaLoading, setFemaLoading] = useState(false);
	const [showDrone, setShowDrone] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	
	const dropdownRef = useRef<HTMLDivElement>(null);
	const femaOverlayRef = useRef<google.maps.ImageMapType | null>(null);
	const mapRef = useRef<google.maps.Map | null>(null);

	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
	});

	// close dropdown on click outside
	React.useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (!document.body.contains(target)) return;
			if (dropdownRef.current && !dropdownRef.current.contains(target)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const toggleFemaLayer = useCallback(() => {
		if (!mapRef.current) return;
		const nextState = !showFema;
		setShowFema(nextState);

		if (nextState) {
			setFemaLoading(true);
			const femaType = new google.maps.ImageMapType({
				getTileUrl: (coord, zoom) => {
					// Convert tile coordinates to approximate Latitude/Longitude for SW FL bounds check
					const n = Math.PI - 2 * Math.PI * coord.y / Math.pow(2, zoom);
					const tileLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
					const tileLng = (coord.x / Math.pow(2, zoom)) * 360 - 180;

					if (tileLat < 25.5 || tileLat > 27.5 || tileLng < -82.6 || tileLng > -81.0) {
						return null; // Don't load FEMA map outside SW Florida
					}

					const initialResolution = 2 * Math.PI * 6378137 / 256;
					const originShift = 2 * Math.PI * 6378137 / 2;
					const zoomResolution = initialResolution / Math.pow(2, zoom);
					const tileWidth = 256 * zoomResolution;
					const minX = coord.x * tileWidth - originShift;
					const maxX = (coord.x + 1) * tileWidth - originShift;
					const minY = originShift - (coord.y + 1) * tileWidth;
					const maxY = originShift - coord.y * tileWidth;
					const bbox = `${minX},${minY},${maxX},${maxY}`;
					return `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/export?bbox=${bbox}&bboxSR=3857&layers=show:28&size=256,256&imageSR=3857&format=png32&transparent=true&f=image`;
				},
				tileSize: new google.maps.Size(256, 256),
				opacity: 0.35, // Made highly transparent so Satellite is visible
				name: "FEMA Flood Zone Map",
			});
			femaOverlayRef.current = femaType;
			mapRef.current.overlayMapTypes.insertAt(0, femaType);

			const listener = mapRef.current.addListener("tilesloaded", () => {
				setFemaLoading(false);
				if (listener) google.maps.event.removeListener(listener);
			});
			setTimeout(() => setFemaLoading(false), 2500);
		} else {
			setFemaLoading(false);
			if (femaOverlayRef.current) {
				const overlayTypes = mapRef.current.overlayMapTypes;
				for (let i = 0; i < overlayTypes.getLength(); i++) {
					if (overlayTypes.getAt(i) === femaOverlayRef.current) {
						overlayTypes.removeAt(i);
						break;
					}
				}
				femaOverlayRef.current = null;
			}
		}
	}, [showFema]);

	const toggleStreetView = useCallback(() => {
		if (!mapRef.current) return;
		const panorama = mapRef.current.getStreetView();
		const nextState = !streetViewActive;
		setStreetViewActive(nextState);

		if (nextState) {
			panorama.setPosition({ lat: Latitude, lng: Longitude });
			panorama.setVisible(true);
		} else {
			panorama.setVisible(false);
		}
	}, [streetViewActive, Latitude, Longitude]);

	const toggleDroneView = useCallback(() => {
		const hasVirtualTour = property?.VirtualTourURLBranded || property?.VirtualTourURLUnbranded;
		if (hasVirtualTour) {
			setShowDrone(!showDrone);
			setDropdownOpen(false);
		} else {
			alert("Drone / Real View photos are not available for this property.");
		}
	}, [property, showDrone]);

	const onLoad = useCallback((map: google.maps.Map) => {
		mapRef.current = map;
		const panorama = map.getStreetView();
		panorama.addListener("visible_changed", () => {
			setStreetViewActive(panorama.getVisible());
		});
	}, []);

	const onUnmount = useCallback(() => {
		mapRef.current = null;
	}, []);

	if (!Latitude || !Longitude) {
		return (
			<div className="text-gray-500 text-sm p-4 bg-gray-50 border rounded-lg text-center">
				Map location not available for this property.
			</div>
		);
	}

	return (
		<div>
			<h4 className="text-lg lg:text-xl font-medium text-gray-900 mb-4">
				Property Map & Views
			</h4>
			<div className="relative" style={mapContainerStyle}>
				
				{/* Unified Map controls dropdown card */}
				<div className="absolute top-4 left-4 z-50 md:top-4 md:right-14 md:left-auto" ref={dropdownRef}>
					<button
						onClick={() => setDropdownOpen(!dropdownOpen)}
						className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-md font-medium text-xs hover:bg-gray-50 transition-colors cursor-pointer"
					>
						<Layers size={13} className="text-[#B89A6A]" />
						<span>Map Options</span>
						<ChevronDown size={11} className="text-gray-400" />
					</button>
					
					{dropdownOpen && (
						<div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2.5">
							<div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Map Style</div>
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
								<input
									type="radio"
									name="propMapStyle"
									checked={mapTypeId === "roadmap" && !showDrone}
									onChange={() => {
										setMapTypeId("roadmap");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("roadmap");
									}}
									className="text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								Standard Map
							</label>
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
								<input
									type="radio"
									name="propMapStyle"
									checked={mapTypeId === "satellite" && !showDrone}
									onChange={() => {
										setMapTypeId("satellite");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("satellite");
									}}
									className="text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								Satellite View
							</label>
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
								<input
									type="radio"
									name="propMapStyle"
									checked={mapTypeId === "hybrid" && !showDrone}
									onChange={() => {
										setMapTypeId("hybrid");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("hybrid");
									}}
									className="text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								Hybrid View (Satellite + Labels)
							</label>
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
								<input
									type="radio"
									name="propMapStyle"
									checked={mapTypeId === "terrain" && !showDrone}
									onChange={() => {
										setMapTypeId("terrain");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("terrain");
									}}
									className="text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								Terrain Map
							</label>
							
							<div className="h-px bg-gray-100 my-0.5" />
							
							<div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Overlays & Views</div>
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={showFema}
									onChange={toggleFemaLayer}
									className="rounded text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								FEMA Flood Map
							</label>
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={streetViewActive}
									onChange={toggleStreetView}
									className="rounded text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								Street View Mode
							</label>
							
							<label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none mt-1">
								<button 
									className="w-full text-left font-semibold text-primary hover:underline"
									onClick={toggleDroneView}
								>
									{showDrone ? "Return to Map" : "Real View / Drone Photos"}
								</button>
							</label>
						</div>
					)}
				</div>

				{/* FEMA Flood Zone Legend & Loading Box */}
				{showFema && !showDrone && (
					<div className="absolute top-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg p-3 max-w-xs transition-all duration-300">
						<div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-gray-100">
							<span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
								<span>🌊 FEMA Flood Zone Legend</span>
							</span>
							{femaLoading ? (
								<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
									<span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
									Loading...
								</span>
							) : (
								<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800">
									Active
								</span>
							)}
						</div>
						<div className="flex flex-col gap-1.5 text-[11px] text-gray-700">
							<div className="flex items-center gap-2">
								<div className="w-3.5 h-3.5 rounded bg-[#FF0000]/70 border border-[#CC0000] shrink-0"></div>
								<span><strong>Zone AE / VE:</strong> High Risk (Insurance Required)</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3.5 h-3.5 rounded bg-[#FFA500]/70 border border-[#CC8400] shrink-0"></div>
								<span><strong>Zone X (Shaded):</strong> Moderate Risk (0.2% Chance)</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-3.5 h-3.5 rounded bg-[#008000]/70 border border-[#006600] shrink-0"></div>
								<span><strong>Zone X (Unshaded):</strong> Low Risk (Minimal Hazard)</span>
							</div>
						</div>
					</div>
				)}

				{showDrone ? (
					<iframe 
						src={property?.VirtualTourURLBranded || property?.VirtualTourURLUnbranded} 
						className="w-full h-full border-0"
						title="Drone / Real View"
					/>
				) : (
					isLoaded && (
						<GoogleMap
							onLoad={onLoad}
							onUnmount={onUnmount}
							center={{ lat: Latitude, lng: Longitude }}
							zoom={16}
							mapTypeId={mapTypeId}
							mapContainerStyle={{ width: "100%", height: "100%" }}
							options={{
								mapTypeControl: false,
								streetViewControl: false,
								fullscreenControl: true,
								zoomControl: true,
							}}
						>
							<Marker position={{ lat: Latitude, lng: Longitude }} />
						</GoogleMap>
					)
				)}
			</div>
		</div>
	);
}
