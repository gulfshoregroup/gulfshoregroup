"use client";
import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { AutocompleteInput } from "../ui/autocomplete";
import { Button } from "../ui/button";
import { ChevronDown, LoaderIcon, Settings2, ChevronsRightIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "../ui/label";

import capitalizeWords from "@/hooks/capitalize-letter";
import Cities from "@/types/cities";
import { Checkbox } from "../ui/checkbox";
import axios from "axios";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/state/store";
import { fetchProperties, setFilters } from "@/state/slices/searchSlice";
import {
	buildQueryFromFilters,
	buildSearchPathWithLocation,
	parseLocationFromPathname,
	parseFiltersFromSearchParams,
} from "@/lib/search-filters";

const priceList = [
	"Minimum",
	"100000",
	"200000",
	"300000",
	"400000",
	"500000",
	"600000",
	"700000",
	"800000",
	"900000",
	"1000000",
	"2000000",
	"3000000",
	"4000000",
	"5000000",
	"6000000",
	"7000000",
	"8000000",
	"9000000",
	"10000000",
	"Maximum",
];

export const propertyTypeOptions: { label: string; value: string }[] =
	[
		{ value: "Homes", label: "Homes" },
		{ value: "Condos", label: "Condos" },
		{ value: "Residential-Lots", label: "Residential Lots" },
	];

const formatPrice = (price: number) => {
	if (price >= 1000000) {
		return `$${(price / 1000000).toFixed(
			price % 1000000 === 0 ? 0 : 1
		)}M`;
	} else if (price >= 1000) {
		return `$${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}k`;
	} else {
		return `$${price}`;
	}
};

export const Filters = ({
	community,
	classname,
	asLink = false,
	listenToUrl = false,
}: {
	community?: string;
	classname?: string;
	asLink?: boolean;
	listenToUrl?: boolean;
}) => {
	const router = useRouter();
	const dispatch = useDispatch<AppDispatch>();
	const reduxFilters = useSelector((state: RootState) => state.search.filters);
	const searchParams = useSearchParams();
	const [loading, setLoading] = useState<boolean>(false);
	const pathname = usePathname();
	const { isLoaded, isSignedIn } = useAuth();

	// States
	const [propertyType, setPropertyType] = useState<string[]>([]);
	const [keywords, setKeywords] = useState<string[]>([]);
	const [minPrice, setMinPrice] = useState("Minimum");
	const [maxPrice, setMaxPrice] = useState("Maximum");
	const [minYearBuilt, setMinYearBuilt] = useState("");
	const [maxYearBuilt, setMaxYearBuilt] = useState("");
	const [bedrooms, setBedrooms] = useState("");
	const [bathrooms, setBathrooms] = useState("");
	const [city, setCity] = useState("");
	const [communityInput, setCommunityInput] = useState("");
	const [subdivision, setSubdivision] = useState("");
	const [school, setSchool] = useState("");
	const [address, setAddress] = useState("");
	const [generalQuery, setGeneralQuery] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [mlsNumber, setMlsNumber] = useState("");
	const [open, setOpen] = useState(false);
	const [hoa, setHoa] = useState("Any");
	const [minAcres, setMinAcres] = useState("");
	const [maxAcres, setMaxAcres] = useState("");
	const [minSqft, setMinSqft] = useState("");
	const [statusFilter, setStatusFilter] = useState("Active");

	// Parse filters from URL query on mount
	useEffect(() => {
		if (listenToUrl && searchParams.get("openFilters") === "true") {
			setOpen(true);
			
			// Remove the openFilters parameter from the URL so that subsequent clicks work
			const newParams = new URLSearchParams(searchParams.toString());
			newParams.delete("openFilters");
			router.replace(`${pathname}?${newParams.toString()}`, { scroll: false });
		}
	}, [searchParams, listenToUrl, pathname, router]);

	useEffect(() => {
		const parsed = parseFiltersFromSearchParams(searchParams);
		const location = parseLocationFromPathname(pathname);
		setCity(location.city || reduxFilters.city || "");
		setCommunityInput(location.developmentName || parsed.developmentName || reduxFilters.developmentName || "");
		setSubdivision(parsed.subdivision || reduxFilters.subdivision || "");
		setSchool(parsed.school || reduxFilters.school || "");
		setAddress(parsed.address || reduxFilters.address || "");
		setGeneralQuery(parsed.q || searchParams.get("search") || reduxFilters.q || "");
		setBedrooms(parsed.beds || reduxFilters.beds || "");
		setBathrooms(parsed.baths || reduxFilters.baths || "");
		setMinPrice(parsed.minPrice || reduxFilters.minPrice || "Minimum");
		setMaxPrice(parsed.maxPrice || reduxFilters.maxPrice || "Maximum");
		setMinYearBuilt(parsed.builtYearMin || reduxFilters.builtYearMin || "");
		setMaxYearBuilt(parsed.builtYearMax || reduxFilters.builtYearMax || "");
		setMinSqft(parsed.minSqft || reduxFilters.minSqft || "");
		setPostalCode(parsed.postalCode || reduxFilters.postalCode || "");
		setPropertyType(parsed.propertyTypes || reduxFilters.propertyTypes || []);
		setKeywords(parsed.features || reduxFilters.features || []);
		setHoa((searchParams.get("hoa") as string) || reduxFilters.hoa || "Any");
		setMinAcres(searchParams.get("minAcres") || reduxFilters.minAcres || "");
		setMaxAcres(searchParams.get("maxAcres") || reduxFilters.maxAcres || "");
		setStatusFilter(searchParams.get("status") || reduxFilters.status || "Active");
	}, [searchParams, pathname, reduxFilters, open]);

	const scrollResultsToTop = () => {
		if (typeof window !== "undefined") {
			window.scrollTo({ top: 0, behavior: "smooth" });
			const container = document.getElementById("container");
			container?.scrollTo({ top: 0, behavior: "smooth" });
		}
	};

	// ------------------------------
	// Apply Filters
	// ------------------------------
	const saveSearchSilently = async (url: string) => {
		try {
			const filters = {
				...reduxFilters,
				city,
				developmentName: communityInput || community || "",
				beds: bedrooms,
				baths: bathrooms,
				minPrice: minPrice === "Minimum" ? "" : minPrice,
				maxPrice: maxPrice === "Maximum" ? "" : maxPrice,
				builtYearMin: minYearBuilt,
				builtYearMax: maxYearBuilt,
				postalCode,
				propertyTypes: propertyType,
				features: keywords,
				page: "1",
			};
			let name;
			const link = `https://gulfshoregroup.com${url}`;
			if (
				filters.city ||
				(filters.propertyTypes && filters.propertyTypes.length > 0)
			) {
				name = `${filters.city || ""} ${
					filters.propertyTypes
						? filters.propertyTypes.join(", ")
						: ""
				}`;
			} else {
				name = "My Saved Search";
			}
			await axios.post("/api/v2/saved-searches", {
				filters,
				link,
				name,
			});
		} catch (error) {
			console.error("Silent background search save failed:", error);
		}
	};

	const handleApplyFilters = () => {
		setLoading(true);

		const min = minPrice === "Minimum" ? "" : minPrice;
		const max = maxPrice === "Maximum" ? "" : maxPrice;

		// Handle MLS redirect early
		if (mlsNumber) {
			router.replace(`/search/${encodeURIComponent(mlsNumber)}`);
			setOpen(false);
			setLoading(false);
			return;
		}

		const nextFilters = {
			...reduxFilters,
			north: null,
			south: null,
			east: null,
			west: null,
			city,
			developmentName: communityInput || community || "",
			subdivision,
			school,
			address,
			q: generalQuery,
			beds: bedrooms,
			baths: bathrooms,
			minPrice: min,
			maxPrice: max,
			builtYearMin: minYearBuilt,
			builtYearMax: maxYearBuilt,
			minSqft,
			postalCode,
			propertyTypes: propertyType,
			features: keywords,
			hoa,
			minAcres,
			maxAcres,
			status: statusFilter,
			page: "1",
		};
		const nextQuery = buildQueryFromFilters(nextFilters, searchParams);
		const nextPath = buildSearchPathWithLocation({
			city,
			developmentName: communityInput || community || "",
		});
		const nextUrl = `${nextPath}?${nextQuery.toString()}`;

		if (isLoaded && isSignedIn) {
			saveSearchSilently(nextUrl);
		}

		dispatch(setFilters(nextFilters));
		router.replace(nextUrl, {
			scroll: false,
		});
		scrollResultsToTop();
		setOpen(false);
		setLoading(false);
	};

	const handleSaveSearch = async (url: string) => {
		if (!isLoaded) return;
		if (!isSignedIn) {
			toast.info("Sign in to save searches", {
				description: "Create an account or log in to save this search.",
			});
			router.push("/signup");
			return;
		}
		try {
			setLoading(true);
			const filters = {
				...reduxFilters,
				city,
				developmentName: community || "",
				beds: bedrooms,
				baths: bathrooms,
				minPrice: minPrice === "Minimum" ? "" : minPrice,
				maxPrice: maxPrice === "Maximum" ? "" : maxPrice,
				builtYearMin: minYearBuilt,
				builtYearMax: maxYearBuilt,
				postalCode,
				propertyTypes: propertyType,
				features: keywords,
				page: "1",
			};
			let name;
			const link = `https://gulfshoregroup.com${url}`;
			if (
				filters.city ||
				(filters.propertyTypes && filters.propertyTypes.length > 0)
			) {
				name = `${filters.city || ""} ${
					filters.propertyTypes
						? filters.propertyTypes.join(", ")
						: ""
				}`;
			} else {
				name = "My Saved Search";
			}
			// Make the POST request to your existing route
			await axios.post("/api/v2/saved-searches", {
				filters,
				link,
				name,
			});
			toast.success("Search saved!", {
				description: "Your search has been successfully saved.",
				action: {
					label: "Copy Link",
					onClick: () => {
						navigator.clipboard.writeText(url);
						toast.success("Link copied to clipboard!");
					},
				},
			});
		} catch (error: any) {
			if (error.response?.status === 400 && error.response?.data?.error === "userId is required") {
				toast.error("Please login to save your search.");
			} else {
				toast.error("Failed to save search");
			}
		} finally {
			setLoading(false);
		}
	};
	const handleSaveAndApplyFilters = () => {
		setLoading(true);

		const min = minPrice === "Minimum" ? "" : minPrice;
		const max = maxPrice === "Maximum" ? "" : maxPrice;

		// Handle MLS redirect early
		if (mlsNumber) {
			router.replace(`/search/${encodeURIComponent(mlsNumber)}`);
			setOpen(false);
			setLoading(false);
			return;
		}

		const nextFilters = {
			...reduxFilters,
			city,
			developmentName: communityInput || community || "",
			subdivision,
			school,
			address,
			q: generalQuery,
			beds: bedrooms,
			baths: bathrooms,
			minPrice: min,
			maxPrice: max,
			builtYearMin: minYearBuilt,
			builtYearMax: maxYearBuilt,
			postalCode,
			propertyTypes: propertyType,
			features: keywords,
			hoa,
			minAcres,
			maxAcres,
			status: statusFilter,
			page: "1",
		};
		const nextQuery = buildQueryFromFilters(nextFilters, searchParams);
		const nextPath = buildSearchPathWithLocation({
			city,
			developmentName: communityInput || community || "",
		});
		const nextUrl = `${nextPath}?${nextQuery.toString()}`;
		handleSaveSearch(nextUrl);
		dispatch(setFilters(nextFilters));
		router.replace(nextUrl, { scroll: false });
		scrollResultsToTop();
		setOpen(false);
	};

	// ------------------------------
	// Render
	// ------------------------------
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				className={
					asLink
						? "text-blue-700 font-medium items-center text-sm md:text-md hover:underline inline-flex gap-0.5 cursor-pointer"
						: "px-4 py-2 border h-9 md:h-12 border-gray-200 w-full rounded-md hidden md:inline-flex justify-center text-center items-center gap-1 text-gray-700 hover:text-primary hover:border-primary hover:bg-white data-[state=open]:border-primary data-[state=open]:text-primary data-[state=open]:bg-white transition-colors" +
						` ${classname}`
				}>
				{asLink ? (
					<>
						<span>Filter Properties</span>
						<ChevronsRightIcon size={20} />
					</>
				) : (
					<>
						<Settings2 size={16} /> <span>Filters</span>
					</>
				)}
			</DialogTrigger>

			<DialogContent className="max-w-3xl max-h-[99dvh] md:max-h-[90vh] overflow-y-auto sm:rounded-2xl rounded-2xl">
				<DialogHeader>
					<DialogTitle>Filters</DialogTitle>
					<p className="text-sm text-gray-500 text-left">
						Tip: Type at least 2 letters in Community, Subdivision, or School to auto-generate search options.
					</p>
				</DialogHeader>

				{/* Grid of filters */}
				<div className="grid grid-cols-2 gap-6 my-3">
					{/* City */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							City
						</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{capitalizeWords(city.replaceAll("-", " ")) || "City"}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="px-3 py-2 max-h-[300px] overflow-y-auto">
								<DropdownMenuRadioGroup
									onValueChange={(value) => setCity(value)}
									className="flex flex-col">
									{Cities.map((c) => (
										<DropdownMenuRadioItem
											value={c}
											key={c}
											className="px-3 py-1.5">
											{capitalizeWords(c.replaceAll("-", " "))}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					{/* Community / Development Name */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Community
						</Label>
						<AutocompleteInput
							type="community"
							value={communityInput}
							onChange={setCommunityInput}
							className="text-sm"
							placeholder="Type 2+ letters (e.g. Pelican Bay)"
						/>
					</div>
					{/* Zipcode */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Zipcode
						</Label>
						<Input
							type="text"
							value={postalCode}
							onChange={(e) => setPostalCode(e.target.value)}
							className="text-sm"
							placeholder="Zipcode"
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<span className="text-sm font-medium text-gray-900">
							Minimum Price
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{minPrice === "Minimum" || minPrice === "Maximum"
									? minPrice
									: formatPrice(Number(minPrice))}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
								<DropdownMenuRadioGroup
									value={minPrice}
									onValueChange={setMinPrice}>
									{priceList
										.filter((price) => {
											if (maxPrice === "Maximum" || !maxPrice)
												return true;
											if (price === "Maximum") return;
											if (price === "Minimum") return true;
											return parseInt(price) < parseInt(maxPrice);
										})
										.map((price) => (
											<DropdownMenuRadioItem
												key={price}
												value={price}>
												{price === "Minimum" || price === "Maximum"
													? price
													: formatPrice(Number(price))}
											</DropdownMenuRadioItem>
										))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="flex flex-col space-y-2">
						<span className="text-sm font-medium text-gray-900">
							Maximum Price
						</span>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{maxPrice === "Maximum"
									? "Maximum"
									: formatPrice(Number(maxPrice))}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
								<DropdownMenuRadioGroup
									value={maxPrice}
									onValueChange={setMaxPrice}>
									{priceList
										.filter((price) => {
											if (price === "Minimum") return false;
											if (minPrice === "Minimum" || !minPrice)
												return true;
											if (price === "Maximum") return true;
											return (
												parseInt(price) > parseInt(minPrice) ||
												price === "Minimum"
											);
										})
										.map((price) => (
											<DropdownMenuRadioItem
												key={price}
												value={price}>
												{price === "Maximum"
													? "Maximum"
													: formatPrice(Number(price))}
											</DropdownMenuRadioItem>
										))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Bedrooms
						</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{bedrooms ? bedrooms + "+" : "Bedrooms"}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="px-3 py-2">
								<DropdownMenuRadioGroup
									onValueChange={(value) => setBedrooms(value)}
									className="flex flex-wrap gap-2">
									{["1+", "2+", "3+", "4+"].map((num) => (
										<DropdownMenuRadioItem
											value={num.replace("+", "")}
											key={num}
											className="border px-3 py-1.5 rounded">
											{num}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Bathrooms
						</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{bathrooms ? bathrooms + "+" : "Bathrooms"}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="px-3 py-2">
								<DropdownMenuRadioGroup
									onValueChange={(value) => setBathrooms(value)}
									className="flex flex-wrap gap-2">
									{["1+", "2+", "3+", "4+"].map((num) => (
										<DropdownMenuRadioItem
											value={num.replace("+", "")}
											key={num}
											onClick={() =>
												setBathrooms(num.replace("+", ""))
											}
											className="border px-3 py-1.5 rounded">
											{num}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Private Pool */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Private Pool
						</Label>
						<div className="flex items-center space-x-2 h-10 px-3 border rounded-lg bg-gray-50/50">
							<Checkbox
								id="private-pool-toggle"
								checked={keywords.includes("Pool")}
								onCheckedChange={(checked) =>
									setKeywords((prev) =>
										checked
											? [...prev, "Pool"]
											: prev.filter((item) => item !== "Pool")
									)
								}
							/>
							<label
								htmlFor="private-pool-toggle"
								className="text-sm text-gray-800 cursor-pointer font-medium">
								Has Private Pool
							</label>
						</div>
					</div>

					{/* HOA Fee */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							HOA Fee / Month
						</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{hoa === "No" ? "No HOA" : hoa || "Any"} <ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuRadioGroup value={hoa} onValueChange={setHoa}>
									<DropdownMenuRadioItem value="Any">Any HOA Fee</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="No">No HOA Fee</DropdownMenuRadioItem>
									<DropdownMenuRadioItem value="Yes">Has HOA Fee</DropdownMenuRadioItem>
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Min Year Built
						</Label>
						<Input
							type="text"
							value={minYearBuilt}
							onChange={(e) => setMinYearBuilt(e.target.value)}
							className="text-sm"
							placeholder="Min Year"
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Max Year Built
						</Label>
						<Input
							type="text"
							value={maxYearBuilt}
							onChange={(e) => setMaxYearBuilt(e.target.value)}
							className="text-sm"
							placeholder="Max Year"
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Minimum Living Sqft
						</Label>
						<Input
							type="number"
							value={minSqft}
							onChange={(e) => setMinSqft(e.target.value)}
							className="text-sm"
							placeholder="e.g. 1500"
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							MLS Number
						</Label>
						<Input
							type="text"
							value={mlsNumber}
							onChange={(e) => setMlsNumber(e.target.value)}
							className="text-sm"
							placeholder="MLS Number"
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Subdivision
						</Label>
						<AutocompleteInput
							type="subdivision"
							value={subdivision}
							onChange={setSubdivision}
							className="text-sm"
							placeholder="Type 2+ letters (e.g. Pelican)"
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							School
						</Label>
						<AutocompleteInput
							type="school"
							value={school}
							onChange={setSchool}
							className="text-sm"
							placeholder="Type 2+ letters..."
						/>
					</div>
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">
							Address / Keyword
						</Label>
						<Input
							type="text"
							value={address || generalQuery}
							onChange={(e) => {
								setAddress(e.target.value);
								setGeneralQuery(e.target.value);
							}}
							className="text-sm"
							placeholder="Street Address or Keyword"
						/>
					</div>
					{/* Property Type */}
					<div className="col-span-2">
						<Label className="text-sm font-medium text-gray-900 mb-2 block">
							Property Type
						</Label>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{propertyTypeOptions.map((type, i) => (
								<div key={i} className="flex items-center space-x-2">
									<Checkbox
										id={`property-type-${i}`}
										checked={propertyType.includes(type.value)}
										onCheckedChange={(checked) =>
											setPropertyType((prev) =>
												checked
													? [...prev, type.value]
													: prev.filter((t) => t !== type.value)
											)
										}
									/>
									<label
										htmlFor={`property-type-${i}`}
										className="text-sm text-gray-700 cursor-pointer">
										{type.label}
									</label>
								</div>
							))}
						</div>
					</div>
					{/* Features */}
					<div className="col-span-2">
						<Label className="text-sm font-medium text-gray-900 mb-2 block">
							Features
						</Label>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{[
								"Gulf Access",
								"Waterfront",
								"Pool",
								"Garage",
								"Spa",
								"Gulf View",
								"Bay View",
								"City View",
								"Lake View",
								"Canal View",
								"Garden View",
								"Golf Course View",
							].map((f, i) => (
								<div key={i} className="flex items-center space-x-2">
									<Checkbox
										id={`keywords-${i}`}
										checked={keywords.includes(f)}
										onCheckedChange={(checked) =>
											setKeywords((prev) =>
												checked
													? [...prev, f]
													: prev.filter((i: any) => i !== f)
											)
										}
									/>
									<label
										htmlFor={`keywords-${i}`}
										className="text-sm text-gray-700 cursor-pointer">
										{f}
									</label>
								</div>
							))}
						</div>
					</div>

					{/* HOA */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">HOA</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{hoa || "Any"} <ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuRadioGroup value={hoa} onValueChange={setHoa}>
									{["Any", "Yes", "No"].map((v) => (
										<DropdownMenuRadioItem key={v} value={v}>{v}</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Min Acres */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">Min Acres</Label>
						<Input
							type="number"
							step="0.1"
							value={minAcres}
							onChange={(e) => setMinAcres(e.target.value)}
							className="text-sm"
							placeholder="e.g. 0.5"
						/>
					</div>

					{/* Max Acres */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">Max Acres</Label>
						<Input
							type="number"
							step="0.1"
							value={maxAcres}
							onChange={(e) => setMaxAcres(e.target.value)}
							className="text-sm"
							placeholder="e.g. 5"
						/>
					</div>

					{/* Status */}
					<div className="flex flex-col space-y-2">
						<Label className="text-sm font-medium text-gray-900">Listing Status</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{statusFilter || "Active"} <ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
									{["Active", "Sold", "Pending", "Short Sale", "Foreclosure", "All"].map((v) => (
										<DropdownMenuRadioItem key={v} value={v}>{v}</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				<div className="flex justify-center w-full">
					{/* Apply Button */}
					<Button
						onClick={() => handleApplyFilters()}
						disabled={loading}
						className="w-full bg-primary hover:bg-accent text-white font-medium py-2.5 rounded-lg transition-colors duration-200 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
						{!loading ? (
							"Apply Filters"
						) : (
							<div className="flex items-center space-x-2">
								<LoaderIcon className="h-4 w-4 animate-spin text-primary-600" />
								<span className="text-sm text-white font-medium">
									Applying filters...
								</span>
							</div>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
