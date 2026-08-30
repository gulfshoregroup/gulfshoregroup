"use client";
import React, { useRef, useCallback, useState } from "react";
import { GoogleMap, useJsApiLoader, MarkerClustererF } from "@react-google-maps/api";
import MarkerItem from "@/components/map/marker";
import { useSelector } from "react-redux";
import { Layers, ChevronDown } from "lucide-react";
import { useAppDispatch } from "@/state/store";
import {
	fetchProperties,
	selectAllProperties,
	selectUi,
	setCoordinates,
	setFilters,
	setLimit,
	setMapCard,
} from "@/state/slices/searchSlice";
import debounce from "@/hooks/useDebounce";
import { SearchParamsResult } from "@/hooks/extractSearchParams";
import { EMPTY_FILTERS } from "@/lib/search-filters";
import { PropertyCard2 } from "@/components/cards/property/property-card";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

const mapContainerStyle = {
	width: "100%",
	height: "100%",
} as const;

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
	"NAPLES": { lat: 26.142, lng: -81.7948 },
	"BONITA SPRINGS": { lat: 26.3398, lng: -81.7787 },
	"ESTERO": { lat: 26.4381, lng: -81.8068 },
	"AVE MARIA": { lat: 26.3359, lng: -81.4384 },
	"MARCO ISLAND": { lat: 25.9363, lng: -81.7157 },
	"FORT MYERS": { lat: 26.6406, lng: -81.8723 },
	"BABCOCK RANCH": { lat: 26.8028, lng: -81.7306 },
	"LEHIGH ACRES": { lat: 26.6180, lng: -81.6437 },
	"IMMOKALEE": { lat: 26.4194, lng: -81.4219 },
	"SANIBEL": { lat: 26.4433, lng: -82.0244 },
	"CAPE CORAL": { lat: 26.5629, lng: -81.9495 },
};

export default function MapComponent({
	filterParams,
}: {
	filterParams: SearchParamsResult;
}) {
	const { user, isSignedIn, isLoaded: isUserLoaded } = useUser();
	const [center, setCenter] = useState({
		lat: 26.142,
		lng: -81.7948,
	});
	const [mapTypeId, setMapTypeId] = useState<"roadmap" | "satellite" | "hybrid" | "terrain">("hybrid");

	const [showDrone, setShowDrone] = useState(false);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [streetViewActive, setStreetViewActive] = useState(false);
	const [showFema, setShowFema] = useState(false);
	const [femaLoading, setFemaLoading] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const femaOverlayRef = useRef<google.maps.ImageMapType | null>(null);
	const hasCenteredRef = useRef(false);
	const isInitialLoadRef = useRef(true);

	const dispatch = useAppDispatch();
	const properties = useSelector(selectAllProperties);
	const ui = useSelector(selectUi);
	
	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
	});

	const mapRef = useRef<google.maps.Map | null>(null);

	// Sync refs for stable debounce function
	const filtersRef = useRef(ui.filters);
	React.useEffect(() => {
		filtersRef.current = ui.filters;
	}, [ui.filters]);

	const filterParamsRef = useRef(filterParams);
	React.useEffect(() => {
		const prev = filterParamsRef.current;
		const locationChanged =
			prev.city !== filterParams.city ||
			prev.community !== filterParams.community ||
			prev.postalCode !== filterParams.postalCode ||
			prev.developmentName !== filterParams.developmentName;

		filterParamsRef.current = filterParams;

		if (locationChanged) {
			hasCenteredRef.current = false; // Reset centering flag when search query / city parameters change
		}
	}, [filterParams]);

	// Close dropdown when clicking outside
	React.useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;
			if (!document.body.contains(target)) return;
			if (dropdownRef.current && !dropdownRef.current.contains(target)) {
				setDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Concurrent properties prefetch on mount
	React.useEffect(() => {
		dispatch(
			setFilters({
				...EMPTY_FILTERS,
				...filterParams,
			})
		);
		dispatch(fetchProperties());
	}, [dispatch, filterParams]);

	// Auto-center map EXACTLY ONCE on city search change or initial property load
	React.useEffect(() => {
		if (hasCenteredRef.current || !mapRef.current) return;

		if (properties.length > 0) {
			const bounds = new window.google.maps.LatLngBounds();
			let hasValidCoords = false;
			properties.forEach((p: any) => {
				const lat = parseFloat(p.Latitude);
				const lng = parseFloat(p.Longitude);
				if (!isNaN(lat) && !isNaN(lng)) {
					bounds.extend({ lat, lng });
					hasValidCoords = true;
				}
			});
			if (hasValidCoords) {
				mapRef.current.fitBounds(bounds);
				// Prevent it from zooming in too close for a single property
				const listener = window.google.maps.event.addListenerOnce(mapRef.current, "bounds_changed", () => {
					if (mapRef.current!.getZoom()! > 16) {
						mapRef.current!.setZoom(16);
					}
				});
				hasCenteredRef.current = true;
			}
		} else {
			const searchCity = filterParams?.city?.toUpperCase() || "";
			if (searchCity && CITY_CENTERS[searchCity]) {
				setCenter(CITY_CENTERS[searchCity]);
				hasCenteredRef.current = true;
			}
		}
	}, [filterParams?.city, properties, isLoaded]);



	const handlemarkerClick = (property: any) => {
		if (
			ui.details === null ||
			ui.details.MLSNumber !== property.MLSNumber
		) {
			dispatch(setMapCard(property));
			
			// Auto-pan the map to the clicked marker so it isn't cut off
			if (mapRef.current) {
				const lat = parseFloat(property.Latitude);
				const lng = parseFloat(property.Longitude);
				if (!isNaN(lat) && !isNaN(lng)) {
					mapRef.current.panTo({ lat, lng });
				}
			}
		} else {
			dispatch(setMapCard(null));
		}
	};

	// Stable debounced refreshData callback (never recreated on filter/state updates)
	const refreshData = useCallback(
		debounce(() => {
			if (!mapRef.current) return;
			if (isInitialLoadRef.current) {
				isInitialLoadRef.current = false;
				return;
			}
			const b = mapRef.current.getBounds();
			if (!b) return;
			const bounds = {
				north: b.getNorthEast().lat(),
				east: b.getNorthEast().lng(),
				south: b.getSouthWest().lat(),
				west: b.getSouthWest().lng(),
			};
			const currentFilters = filtersRef.current;
			const currentParams = filterParamsRef.current;

			if (currentParams && ui.listView === false) {
				const fetchdata = async () => {
					dispatch(
						setFilters({
							...currentFilters,
							...currentParams,
							...bounds,
						})
					);
					dispatch(setLimit(100));

					dispatch(fetchProperties());
				};
				fetchdata();
			} else {
				dispatch(setCoordinates(bounds));
				dispatch(setLimit(100));
				dispatch(fetchProperties());
			}
		}, 650),
		[dispatch]
	);

	const toggleFemaLayer = useCallback(() => {
		if (!mapRef.current) return;
		const nextState = !showFema;
		setShowFema(nextState);
		if (nextState) {
			const currentZoom = mapRef.current.getZoom() || 10;
			if (currentZoom < 14) {
				mapRef.current.setZoom(14);
				toast.info("Zoomed in to show FEMA details", {
					description: "FEMA flood zones are only visible when zoomed in closer to neighborhoods.",
					duration: 4000,
				});
			}
			setFemaLoading(true);
			const femaType = new google.maps.ImageMapType({
				getTileUrl: (coord, zoom) => {
					if (zoom < 9) return null;
					
					// Convert tile coordinates to approximate Latitude/Longitude
					const n = Math.PI - 2 * Math.PI * coord.y / Math.pow(2, zoom);
					const tileLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
					const tileLng = (coord.x / Math.pow(2, zoom)) * 360 - 180;

					// Restrict to Southwest Florida roughly
					if (tileLat < 25.5 || tileLat > 27.5 || tileLng < -82.6 || tileLng > -81.0) {
						return null; // Don't load FEMA map outside SW Florida
					}

					// Use official FEMA API with transparent background instead of ESRI solid tiles
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
				opacity: 0.5,
				name: "FEMA Flood Zone Map",
			});
			femaOverlayRef.current = femaType;
			mapRef.current.overlayMapTypes.insertAt(0, femaType);

			// Automatically clear loading status once tiles begin rendering or fallback after 2.5s
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
			const centerCoord = mapRef.current.getCenter();
			if (centerCoord) {
				panorama.setPosition(centerCoord);
				panorama.setVisible(true);
			}
		} else {
			panorama.setVisible(false);
		}
	}, [streetViewActive]);

	const toggleDroneView = useCallback(() => {
		if (!ui.details) {
			alert("Please select a property marker on the map first to view its Drone / Real View photos.");
			return;
		}
		const hasVirtualTour = ui.details.VirtualTourURLBranded || ui.details.VirtualTourURLUnbranded;
		if (hasVirtualTour) {
			setShowDrone(!showDrone);
			setDropdownOpen(false);
		} else {
			alert("Drone / Real View photos are not available for this property.");
		}
	}, [ui.details, showDrone]);

	const onLoad = useCallback(
		(map: google.maps.Map) => {
			mapRef.current = map;
			map.addListener("idle", refreshData);
			const panorama = map.getStreetView();
			panorama.addListener("visible_changed", () => {
				setStreetViewActive(panorama.getVisible() || false);
			});
		},
		[refreshData]
	);

	const onUnmount = useCallback(() => {
		mapRef.current = null;
	}, []);

	// Group properties by lat/lng to detect duplicates and offset them
	const processedProperties = React.useMemo(() => {
		const coordinateCounts: Record<string, number> = {};
		
		return properties.map((item) => {
			const lat = parseFloat(item.Latitude);
			const lng = parseFloat(item.Longitude);
			if (isNaN(lat) || isNaN(lng)) return item;
			
			// Round to 5 decimal places to catch very close or identical coordinates
			const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
			
			if (coordinateCounts[key] !== undefined) {
				coordinateCounts[key] += 1;
				const count = coordinateCounts[key];
				// Apply a tiny offset (approx 6-10 meters) using circle distribution
				const angle = (count * 2 * Math.PI) / 8;
				const radius = 0.00006 * Math.ceil(count / 8);
				
				const newLat = lat + radius * Math.sin(angle);
				const newLng = lng + radius * Math.cos(angle);
				
				return {
					...item,
					Latitude: newLat.toString(),
					Longitude: newLng.toString(),
				};
			} else {
				coordinateCounts[key] = 0;
				return item;
			}
		});
	}, [properties]);

	// Handle right-click on the map to zoom out
	const handleRightClick = useCallback(() => {
		if (mapRef.current) {
			const currentZoom = mapRef.current.getZoom();
			if (currentZoom !== undefined) {
				mapRef.current.setZoom(currentZoom - 1);
			}
		}
	}, []);

	// Show map controls tip for first-time logged-in users
	React.useEffect(() => {
		if (isUserLoaded && isSignedIn && user) {
			const key = `gulfshore_map_tip_${user.id}`;
			const hasSeen = localStorage.getItem(key);
			if (!hasSeen) {
				toast.info("Map Navigation Tip", {
					description: "Left mouse button double click to zoom in. Right mouse button click to zoom out.",
					duration: 10000,
				});
				localStorage.setItem(key, "true");
			}
		}
	}, [isUserLoaded, isSignedIn, user]);

	return (
		<div className="h-full w-full grow relative rounded-xl">
			{/* Unified Map controls dropdown card */}
			<div className="absolute top-4 left-4 z-[60]" ref={dropdownRef}>
				<button
					onClick={() => setDropdownOpen(!dropdownOpen)}
					className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-800 border border-gray-200 rounded-lg shadow-md font-medium text-sm hover:bg-gray-50 transition-colors cursor-pointer"
				>
					<Layers size={16} className="text-[#B89A6A]" />
					<span>Map Options</span>
					<ChevronDown size={14} className="text-gray-400" />
				</button>
				
				{dropdownOpen && (
					<div className="absolute left-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50 flex flex-col gap-4">
						<div className="flex flex-col gap-3">
							<div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Map Style</div>
							<label className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer select-none">
								<input
									type="radio"
									name="mapStyle"
									checked={mapTypeId === "roadmap" && !showDrone}
									onChange={() => {
										setMapTypeId("roadmap");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("roadmap");
									}}
									className="w-4 h-4 text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1"
								/>
								Standard Map
							</label>
							<label className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer select-none">
								<input
									type="radio"
									name="mapStyle"
									checked={mapTypeId === "satellite" && !showDrone}
									onChange={() => {
										setMapTypeId("satellite");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("satellite");
									}}
									className="w-4 h-4 text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1"
								/>
								Satellite View
							</label>
							<label className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer select-none">
								<input
									type="radio"
									name="mapStyle"
									checked={mapTypeId === "hybrid" && !showDrone}
									onChange={() => {
										setMapTypeId("hybrid");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("hybrid");
									}}
									className="w-4 h-4 text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1"
								/>
								Hybrid View (Satellite + Labels)
							</label>
							<label className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer select-none">
								<input
									type="radio"
									name="mapStyle"
									checked={mapTypeId === "terrain" && !showDrone}
									onChange={() => {
										setMapTypeId("terrain");
										setShowDrone(false);
										if (mapRef.current) mapRef.current.setMapTypeId("terrain");
									}}
									className="w-4 h-4 text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1"
								/>
								Terrain Map
							</label>
						</div>

						<div className="h-px bg-gray-100" />
						
						<div className="flex flex-col gap-3">
							<div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overlays & Features</div>
							<label className="flex items-center gap-3 text-sm text-gray-800 cursor-pointer select-none">
								<input
									type="checkbox"
									checked={showFema}
									onChange={toggleFemaLayer}
									className="w-4 h-4 rounded text-[#B89A6A] focus:ring-[#B89A6A] focus:ring-1 cursor-pointer"
								/>
								FEMA Flood Map
							</label>
						</div>

						<div className="h-px bg-gray-100" />
						
						<button 
							className="w-full text-left font-medium text-sm text-primary hover:underline py-1"
							onClick={toggleDroneView}
						>
							{showDrone ? "Return to Map" : "Real View / Drone Photos"}
						</button>
					</div>
				)}
			</div>

			{/* FEMA Flood Zone Legend & Loading Box */}
			{showFema && !showDrone && (
				<div className="absolute top-16 md:top-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg p-3 max-w-[280px] sm:max-w-xs transition-all duration-300">
					<div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-gray-100">
						<span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
							<span>🌊 FEMA Flood Zone Legend</span>
						</span>
						{femaLoading ? (
							<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 animate-pulse">
								<span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
								Loading...
							</span>
						) : (
							<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-800">
								Active
							</span>
						)}
					</div>
					<div className="flex flex-col gap-2 text-[11px] text-gray-700">
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

			{showDrone && ui.details ? (
				<iframe 
					src={ui.details.VirtualTourURLBranded || ui.details.VirtualTourURLUnbranded} 
					className="w-full h-full border-0 rounded-xl"
					title="Drone / Real View"
				/>
			) : isLoaded && (
				<GoogleMap
					onLoad={onLoad}
					onUnmount={onUnmount}
					center={center}
					zoom={10}
					mapTypeId={mapTypeId}
					mapContainerStyle={mapContainerStyle}
					onRightClick={handleRightClick}
					options={{
						clickableIcons: false,
						mapTypeControl: false,
						streetViewControl: false,
						fullscreenControl: false,
						zoomControl: true,
						zoomControlOptions: {
							position: window.google.maps.ControlPosition.RIGHT_CENTER,
						},
					}}
				>
					<MarkerClustererF>
						{(clusterer) => (
							<>
								{processedProperties.map((item) => (
									<MarkerItem
										key={item.MLSNumber}
										item={item}
										handleMarkerClick={handlemarkerClick}
										clusterer={clusterer}
									/>
								))}
								{ui.details && !processedProperties.some(p => p.MLSNumber === ui.details?.MLSNumber) && (
									<MarkerItem
										key={ui.details.MLSNumber}
										item={ui.details}
										handleMarkerClick={handlemarkerClick}
										clusterer={clusterer}
									/>
								)}
							</>
						)}
					</MarkerClustererF>
				</GoogleMap>
			)}
			{ui.details && !showDrone && (
				<div className="absolute bottom-2 left-2 right-2 z-40 lg:hidden">
					<PropertyCard2
						property={ui.details}
						onCardClose={() => dispatch(setMapCard(null))}
					/>
				</div>
			)}
		</div>
	);
}

