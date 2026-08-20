"use client";
import SortComponent from "./sort";
import { Filters } from "./desktopFilters";
import { Button } from "../ui/button";
import { ChevronDown, List, MapIcon, Home, Building2, Layers, Waves, Anchor } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	usePathname,
	useRouter,
	useSearchParams,
} from "next/navigation";
import SaveSearchButton from "./saveSearch";
import SearchBox from "../home/searchField";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { fetchProperties, setFilters } from "@/state/slices/searchSlice";
import { buildQueryFromFilters } from "@/lib/search-filters";
import { formatPrice } from "@/hooks/formatPrice";
import { propertyTypeOptions } from "./desktopFilters";

const PRICE_OPTIONS = [
	"",
	"100000",
	"200000",
	"300000",
	"500000",
	"750000",
	"1000000",
	"2000000",
	"3000000",
	"5000000",
];

// Quick category chips — LoopNet style but Gulfshore branded
const QUICK_CATEGORIES = [
	{ label: "Homes", value: "Homes", icon: Home },
	{ label: "Condos", value: "Condos", icon: Building2 },
	{ label: "Lots", value: "Residential-Lots", icon: Layers },
];

// Special feature filter chips — toggled in the features[] array
const FEATURE_CHIPS = [
	{ label: "Waterfront", key: "Waterfront", icon: Waves },
	{ label: "Gulf Access", key: "Gulf Access", icon: Anchor },
];

export default function StickySearchBar() {
	const path = usePathname();
	const router = useRouter();
	const params = useSearchParams();
	const view = params.get("view");
	const dispatch = useDispatch<AppDispatch>();
	const { filters } = useSelector((state: RootState) => state.search);

	const onQuickPriceChange = (minPrice: string, maxPrice: string) => {
		const nextFilters = {
			...filters,
			minPrice,
			maxPrice,
			page: "1",
		};
		const nextParams = buildQueryFromFilters(nextFilters, params);
		dispatch(setFilters(nextFilters));
		router.replace(`${path}?${nextParams.toString()}`, { scroll: false });
		window.scrollTo({ top: 0, behavior: "smooth" });
		document.getElementById("container")?.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const onPropertyTypeToggle = (value: string, checked: boolean) => {
		const nextTypes = checked
			? [...filters.propertyTypes, value]
			: filters.propertyTypes.filter((t) => t !== value);
		const nextFilters = {
			...filters,
			propertyTypes: nextTypes,
			page: "1",
		};
		const nextParams = buildQueryFromFilters(nextFilters, params);
		dispatch(setFilters(nextFilters));
		router.replace(`${path}?${nextParams.toString()}`, { scroll: false });
		window.scrollTo({ top: 0, behavior: "smooth" });
		document.getElementById("container")?.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const onQuickCategoryToggle = (value: string, checked: boolean) => {
		// Single-select behavior for quick chips: if checking, clear others and set this one. If unchecking, clear all.
		const nextTypes = checked ? [value] : [];
		const nextFilters = {
			...filters,
			propertyTypes: nextTypes,
			page: "1",
		};
		const nextParams = buildQueryFromFilters(nextFilters, params);
		dispatch(setFilters(nextFilters));
		router.replace(`${path}?${nextParams.toString()}`, { scroll: false });
		window.scrollTo({ top: 0, behavior: "smooth" });
		document.getElementById("container")?.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const onFeatureToggle = (key: string) => {
		const currentFeatures: string[] = filters.features || [];
		const isActive = currentFeatures.includes(key);
		const nextFeatures = isActive
			? currentFeatures.filter((f) => f !== key)
			: [...currentFeatures, key];
		const nextFilters = {
			...filters,
			features: nextFeatures,
			page: "1",
		};
		const nextParams = buildQueryFromFilters(nextFilters, params);
		dispatch(setFilters(nextFilters));
		router.replace(`${path}?${nextParams.toString()}`, { scroll: false });
		document.getElementById("container")?.scrollTo({ top: 0, behavior: "smooth" });
	};

	const quickPriceLabel =
		filters.minPrice || filters.maxPrice
			? `${filters.minPrice ? formatPrice(Number(filters.minPrice)) : "Any"} - ${
					filters.maxPrice ? formatPrice(Number(filters.maxPrice)) : "Any"
			  }`
			: "Price";

	return (
		<div className="sticky px-3 md:px-4 border-b border-gray-200 gap-1.5 h-min py-2 flex flex-col top-0 inset-0 z-50 bg-white/95 backdrop-blur-sm">
			{/* Row 1: Search box + Map/List toggle */}
			<div className="flex items-center gap-2 w-full">
				<SearchBox compact={true} classname="flex-1 min-w-0 md:min-w-[320px] lg:min-w-[400px] flex justify-between p-1 rounded-md bg-white items-center gap-1 border" />
				
				{/* Mobile Filters Button - Always Visible */}
				<Filters classname="!flex md:!hidden flex-shrink-0 !w-auto !px-3" />
				<SortComponent classname="!flex md:!hidden flex-shrink-0 !w-auto !px-3" />

				<a
					className="hidden md:block ml-auto"
					href={`${path}?${(() => {
						const next = new URLSearchParams(params.toString());
						next.set("view", view === "map" ? "list" : "map");
						return next.toString();
					})()}`}>
					<Button
						className="rounded-md shadow-none border-gray-200 md:h-10 whitespace-nowrap text-gray-700 hover:text-primary hover:border-primary hover:bg-white"
						variant="outline">
						{view === "map" ? (
							<><List className="h-4 w-4" /> List View</>
						) : (
							<><MapIcon className="h-4 w-4" /> Map View</>
						)}
					</Button>
				</a>
			</div>

			{/* Row 2: Quick chips + filters */}
			<div className="w-full overflow-x-auto">
				<div className="flex gap-1.5 items-center min-w-max pb-0.5">

					{/* Property Type Icon Chips */}
					{QUICK_CATEGORIES.map(({ label, value, icon: Icon }) => {
						const active = filters.propertyTypes.includes(value);
						return (
							<button
								key={value}
								onClick={() => onQuickCategoryToggle(value, !active)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap
									${active
										? "bg-primary text-white border-primary"
										: "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
									}`}>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</button>
						);
					})}

					{/* Feature chips: Waterfront, Gulf Access */}
					{FEATURE_CHIPS.map(({ label, key, icon: Icon }) => {
						const active = (filters.features || []).includes(key);
						return (
							<button
								key={key}
								onClick={() => onFeatureToggle(key)}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors whitespace-nowrap
									${active
										? "bg-primary text-white border-primary"
										: "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
									}`}>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</button>
						);
					})}

					{/* Divider */}
					<div className="w-px h-5 bg-gray-200 mx-1" />

					{/* Price Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="rounded-md shadow-none border-gray-200 h-9 text-gray-700 hover:text-primary hover:border-primary hover:bg-white data-[state=open]:border-primary data-[state=open]:text-primary data-[state=open]:bg-white"
								variant="outline">
								{quickPriceLabel}
								<ChevronDown size={14} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-72 p-3">
							<div className="grid grid-cols-2 gap-2">
								{PRICE_OPTIONS.map((min) => {
									const max = min ? "" : "";
									return (
										<Button
											key={`min-${min || "any"}`}
											variant="ghost"
											size="sm"
											onClick={() => onQuickPriceChange(min, max)}
											className="justify-start">
											{min ? `From ${formatPrice(Number(min))}` : "Any price"}
										</Button>
									);
								})}
							</div>
						</DropdownMenuContent>
					</DropdownMenu>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								className="rounded-md shadow-none border-gray-200 h-9 text-gray-700 hover:text-primary hover:border-primary hover:bg-white data-[state=open]:border-primary data-[state=open]:text-primary data-[state=open]:bg-white"
								variant="outline">
								Property Type
								<ChevronDown size={14} />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem
								onSelect={() => {
									const nextFilters = {
										...filters,
										propertyTypes: ["Residential", "Land", "Commercial", "Income"],
										page: "1",
									};
									const nextParams = buildQueryFromFilters(nextFilters, params);
									dispatch(setFilters(nextFilters));
									router.replace(`${path}?${nextParams.toString()}`, { scroll: false });
									window.scrollTo({ top: 0, behavior: "smooth" });
									document.getElementById("container")?.scrollTo({
										top: 0,
										behavior: "smooth",
									});
								}}
								className="font-semibold text-primary cursor-pointer mb-1"
							>
								Select All Types
							</DropdownMenuItem>
							<div className="h-px bg-gray-200 my-1" />
							{propertyTypeOptions.map((type) => (
								<DropdownMenuCheckboxItem
									key={type.value}
									checked={filters.propertyTypes.includes(type.value)}
									onCheckedChange={(checked) =>
										onPropertyTypeToggle(type.value, Boolean(checked))
									}>
									{type.label}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>

					<Filters classname="hidden md:!inline-flex" listenToUrl={true} />
					<SortComponent classname="hidden md:!inline-flex" />
					<SaveSearchButton />
				</div>
			</div>
		</div>
	);
}


