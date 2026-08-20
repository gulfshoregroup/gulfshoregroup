"use client";
import {
	ChevronDown,
	LoaderIcon,
	Search,
	Settings2,
	X,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import capitalizeWords from "@/hooks/capitalize-letter";
import { SortItem, SortItems } from "@/lib/constants";
import Cities from "@/types/cities";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import axios from "axios";
import ExtractSearchParams from "@/hooks/extractSearchParams";
import { AutocompleteInput } from "../ui/autocomplete";
import { useEffect } from "react";

export default function MobileFiltersModal({
	community,
	classname,
}: {
	community?: string;
	classname?: string;
}) {
	const params = usePathname().split("/");
	const [isExpanded, setIsExpanded] = useState(false);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState("");
	const [propertyType, setPropertyType] = useState<string[]>([]);
	const [minPrice, setMinPrice] = useState("Minimum");
	const [maxPrice, setMaxPrice] = useState("Maximum");
	const [minYearBuilt, setMinYearBuilt] = useState("");
	const [maxYearBuilt, setMaxYearBuilt] = useState("");
	const [bedrooms, setBedrooms] = useState("");
	const [bathrooms, setBathrooms] = useState("");
	const [city, setCity] = useState("");
	const [communityInput, setCommunityInput] = useState(community || "");
	const [subdivision, setSubdivision] = useState("");
	const [school, setSchool] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [keywords, setKeywords] = useState<string[]>([]);
	const [hoa, setHoa] = useState("Any");
	const [minAcres, setMinAcres] = useState("");
	const [maxAcres, setMaxAcres] = useState("");
	const [minSqft, setMinSqft] = useState("");
	const [statusFilter, setStatusFilter] = useState("Active");

	const [mlsNumber, setMlsNumber] = useState("");
	const [sort, setSort] = useState<SortItem | undefined>(
		SortItems[1]
	);

	const router = useRouter();
	const searchParams = useSearchParams();
	const { isLoaded, isSignedIn } = useAuth();

	useEffect(() => {
		if (searchParams?.get("openFilters") === "true") {
			setIsExpanded(true);
		}
	}, [searchParams]);


	const handleSearch = () => {
		if (query) {
			history.pushState(
				null,
				"",
				`/search/${query
					.replaceAll(", ", "_")
					.replaceAll(" ", "-")
					.replaceAll("/", "-")}`
			);
		} else {
			history.pushState(null, "", "/Florida-Real-Estate-Search");
		}
	};
	const formatPrice = (price: number) => {
		if (price >= 1000000) {
			return `$${(price / 1000000).toFixed(
				price % 1000000 === 0 ? 0 : 1
			)}M`;
		} else if (price >= 1000) {
			return `$${(price / 1000).toFixed(
				price % 1000 === 0 ? 0 : 1
			)}k`;
		} else {
			return `$${price}`;
		}
	};

	const saveSearchSilently = async (url: string) => {
		try {
			const filters = await ExtractSearchParams(url.split("/"));
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
			console.error("Silent background search save failed (mobile):", error);
		}
	};

	const handleApplyFilters = () => {
		setLoading(true);
		const beds = bedrooms;
		const baths = bathrooms;
		const min = minPrice === "Minimum" ? "" : minPrice;
		const max = maxPrice === "Maximum" ? "" : maxPrice;
		const minyear = minYearBuilt;
		const maxyear = maxYearBuilt;
		const postal = postalCode;
		const mls = mlsNumber;

		// Property type map
		const typeMap: Record<string, string> = {
			"Single Family": "Homes",
			Condo: "Condos",
			Land: "Residential-Lots",
		};

		const mappedTypes = propertyType
			.map((t) => typeMap[t])
			.filter(Boolean);

		// Handle MLS redirect early
		if (mls) {
			history.pushState(
				null,
				"",
				"/search/" + encodeURIComponent(mls)
			);
			return;
		}

		// Base path (map or search)
		let url = params.includes("map")
			? "/map"
			: "/Florida-Real-Estate-Search";

		const citySlug = encodeURIComponent(
			capitalizeWords(city).replaceAll(" ", "-")
		);
		const comm = communityInput || community || "";
		const communitySlug = comm
			? encodeURIComponent(comm.replaceAll(" ", "-"))
			: "";

		if (mappedTypes.length === 1) {
			const typeSegment = mappedTypes[0];
			url += communitySlug
				? `/${typeSegment}/${citySlug}/${communitySlug}`
				: `/${typeSegment}/${citySlug}`;
		} else if (mappedTypes.length > 1) {
			const typesString = mappedTypes.join(",");
			url += communitySlug
				? `/${citySlug}/${communitySlug}/propertyTypes=${typesString}`
				: `/${citySlug}/propertyTypes=${typesString}`;
		} else {
			url += communitySlug
				? `/${citySlug}/${communitySlug}`
				: `/${citySlug}`;
		}

		// Append additional filters
		const segments: string[] = [];
		if (beds) segments.push(`${beds}-beds`);
		if (baths) segments.push(`${baths}-baths`);
		if (min) segments.push(`${min}-minPrice`);
		if (max) segments.push(`${max}-maxPrice`);
		if (minyear) segments.push(`${minyear}-minBuiltYear`);
		if (maxyear) segments.push(`${maxyear}-maxBuiltYear`);
		if (postal) segments.push(`${postal}-postalCode`);
		if (minSqft) segments.push(`${minSqft}-minSqft`);
		if (keywords.length) {
			if (keywords.includes("Waterfront"))
				segments.push(`keyword-waterfront`);
			if (keywords.includes("Gulf Access"))
				segments.push(`keyword-gulfaccess`);
			if (keywords.includes("Pool"))
				segments.push(`keyword-pool`);
			if (keywords.includes("Garage"))
				segments.push(`keyword-garage`);
			if (keywords.includes("Spa"))
				segments.push(`keyword-spa`);
		}
		if (segments.length) {
			url += "/" + segments.join("/");
		}

		// Append new query params
		const queryParams = new URLSearchParams();
		if (hoa && hoa !== "Any") queryParams.set("hoa", hoa);
		if (minAcres) queryParams.set("minAcres", minAcres);
		if (maxAcres) queryParams.set("maxAcres", maxAcres);
		if (minSqft) queryParams.set("minSqft", minSqft);
		if (statusFilter && statusFilter !== "Active") queryParams.set("status", statusFilter);
		if (subdivision) queryParams.set("subdivision", subdivision);
		if (school) queryParams.set("school", school);
		if (comm && !citySlug) queryParams.set("developmentName", comm);
		
		const queryString = queryParams.toString();
		if (queryString) {
			url += "?" + queryString;
		}

		if (isLoaded && isSignedIn) {
			saveSearchSilently(url);
		}

		router.replace(url);
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
			const filters = await ExtractSearchParams(url.split("/"));
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

			return;
		}
		const typeMap: Record<string, string> = {
			"Single Family": "Homes",
			Condo: "Condos",
			Land: "Residential-Lots",
		};

		const mappedTypes = propertyType
			.map((t) => typeMap[t])
			.filter(Boolean);

		// Base path (map or search)
		let url = params.includes("map")
			? "/map"
			: "/Florida-Real-Estate-Search";

		const citySlug = city
			? encodeURIComponent(capitalizeWords(city).replaceAll(" ", "-"))
			: "";
		const comm = communityInput || community || "";
		const communitySlug = comm
			? encodeURIComponent(comm.trim().replaceAll(" ", "-"))
			: "";

		// Property type handling
		if (mappedTypes.length === 1) {
			url += communitySlug
				? `/${mappedTypes[0]}/${citySlug}/${communitySlug}`
				: `/${mappedTypes[0]}/${citySlug}`;
		} else if (mappedTypes.length > 1) {
			const typesString = mappedTypes.join(",");
			url += communitySlug
				? `/${citySlug}/${communitySlug}/propertyTypes=${typesString}`
				: `/${citySlug}/propertyTypes=${typesString}`;
		} else {
			url += communitySlug
				? `/${citySlug}/${communitySlug}`
				: `/${citySlug}`;
		}

		// Append additional filters
		const segments: string[] = [];
		if (bedrooms) segments.push(`${bedrooms}-beds`);
		if (bathrooms) segments.push(`${bathrooms}-baths`);
		if (min) segments.push(`${min}-minPrice`);
		if (max) segments.push(`${max}-maxPrice`);
		if (minYearBuilt) segments.push(`${minYearBuilt}-minBuiltYear`);
		if (maxYearBuilt) segments.push(`${maxYearBuilt}-maxBuiltYear`);
		if (postalCode) segments.push(`${postalCode}-postalCode`);
		if (keywords.length) {
			if (keywords.includes("Waterfront"))
				segments.push(`keyword-waterfront`);
			if (keywords.includes("Gulf Access"))
				segments.push(`keyword-gulfaccess`);
			if (keywords.includes("Pool"))
				segments.push(`keyword-pool`);
			if (keywords.includes("Garage"))
				segments.push(`keyword-garage`);
			if (keywords.includes("Spa"))
				segments.push(`keyword-spa`);
		}
		if (segments.length) url += "/" + segments.join("/");

		// Append new query params
		const queryParams = new URLSearchParams();
		if (hoa && hoa !== "Any") queryParams.set("hoa", hoa);
		if (minAcres) queryParams.set("minAcres", minAcres);
		if (maxAcres) queryParams.set("maxAcres", maxAcres);
		if (statusFilter && statusFilter !== "Active") queryParams.set("status", statusFilter);
		if (subdivision) queryParams.set("subdivision", subdivision);
		if (school) queryParams.set("school", school);
		if (comm && !citySlug) queryParams.set("developmentName", comm);
		
		const queryString = queryParams.toString();
		if (queryString) {
			url += "?" + queryString;
		}
		handleSaveSearch(url);
		router.replace(url);
	};

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
	const propertyTypeOptions: { label: string; value: string }[] = [
		{ value: "Single Family", label: "Homes" },
		{ value: "Condo", label: "Condos" },
		{ value: "Land", label: "Residential Lots" },
	];

	const handleClose = () => {
		setIsExpanded(false);
	};

	return (
		<div>
			<div className={isExpanded ? "hidden" : ""}>
				<Button
					onClick={() => setIsExpanded(true)}
					variant={"outline"}
					className={
						"md:hidden shadow-none border border-gray-200 text-center inline-flex rounded-lg justify-center md:justify-between gap-1 items-center" +
						` ${classname}`
					}>
					<Settings2 size={10} />
					Filters
				</Button>
			</div>

			{/* Full Screen Modal Overlay */}
			<div
				className={
					isExpanded
						? "fixed top-0 bottom-0 left-0 right-0 inset-0 z-10000 bg-white overflow-hidden"
						: "hidden"
				}>
				{/* Header - Fixed at top */}
				<div className="fixed top-0 left-0 right-0  flex items-center justify-between p-4 bg-white border-b border-gray-200">
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClose}
						className="p-2 hover:bg-gray-100 rounded-full">
						<X className="w-5 h-5" />
					</Button>
					<h2 className="text-lg font-semibold">Search</h2>
					<div className="w-9" /> {/* Spacer */}
				</div>

				{/* Scrollable Content Area */}
				<div className="pt-[72px] pb-[88px] h-full max-h-[calc(100vh-120px)] overflow-y-auto">
					<div className="p-4 space-y-6">
						{/* Filters */}
						<div className="space-y-4">
							<div className="border-t border-gray-200 pt-6">
								<h3 className="text-sm font-medium text-gray-700 mb-1">
									Filters
								</h3>
								<p className="text-xs text-gray-500 mb-3">
									Tip: Type at least 2 letters in Community, Subdivision, or School to auto-generate options.
								</p>
								<div className="space-y-3">
									<div className="flex flex-col gap-6 my-3">
										<div className="flex flex-col space-y-2">
											<Label className="text-sm font-medium text-gray-900">
												City
											</Label>
											<DropdownMenu>
												<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
													{capitalizeWords(
														city.replaceAll("-", " ")
													) || "City"}{" "}
													<ChevronDown size={14} />
												</DropdownMenuTrigger>
												<DropdownMenuContent className="px-3 py-2 max-h-[200px] overflow-y-auto">
													<DropdownMenuGroup className="flex flex-col">
														{Cities.map((c) => (
															<DropdownMenuItem
																key={c}
																onClick={() => setCity(c)}
																className="px-3 py-1.5">
																{capitalizeWords(
																	c.replaceAll("-", " ")
																)}
															</DropdownMenuItem>
														))}
													</DropdownMenuGroup>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>

										<div className="flex flex-col space-y-2">
											<Label className="text-sm font-medium text-gray-900">
												Community
											</Label>
											<AutocompleteInput
												type="community"
												value={communityInput}
												onChange={setCommunityInput}
												className="text-sm"
												placeholder="e.g. Pelican Bay"
											/>
										</div>

										<div className="col-span-2">
											<Label className="text-sm font-medium text-gray-900 mb-2 block">
												Property Type
											</Label>
											<div className="grid grid-cols-2 gap-4">
												{propertyTypeOptions.map((type) => (
													<div
														key={type.value}
														className="flex items-center space-x-2">
														<Checkbox
															id={type.value}
															checked={propertyType.includes(
																type.value
															)}
															onCheckedChange={(checked) => {
																setPropertyType((prev) =>
																	checked
																		? [...prev, type.value]
																		: prev.filter(
																				(t) => t !== type.value
																		  )
																);
															}}
														/>
														<label
															htmlFor={type.value}
															className="text-sm text-gray-700 cursor-pointer">
															{type.label}
														</label>
													</div>
												))}
											</div>
										</div>

										<div className="col-span-2">
											<Label className="text-sm font-medium text-gray-900 mb-2 block">
												Features
											</Label>
											<div className="grid grid-cols-2 gap-4">
												{["Gulf Access", "Waterfront", "Pool", "Garage", "Spa"].map(
													(f, i) => (
														<div
															key={i}
															className="flex items-center space-x-2">
															<Checkbox
																id={`keywords-${i}`}
																checked={keywords.includes(f)}
																onCheckedChange={(checked) =>
																	setKeywords((prev) =>
																		checked
																			? [...prev, f]
																			: prev.filter(
																					(i: any) => i !== f
																			  )
																	)
																}
															/>
															<label
																htmlFor={`keywords-${i}`}
																className="text-sm text-gray-700 cursor-pointer">
																{f}
															</label>
														</div>
													)
												)}
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

										{/* Acres */}
										<div className="flex gap-2 w-full">
											<div className="flex w-full flex-col space-y-2">
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
											<div className="flex w-full flex-col space-y-2">
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


										<div className="flex flex-col space-y-2">
											<Label className="text-sm font-medium text-gray-900">
												Bedrooms
											</Label>
											<div className="flex flex-wrap gap-2">
												{["1+", "2+", "3+", "4+"].map((num) => (
													<Button
														key={num}
														onClick={() =>
															setBedrooms(num.replace("+", ""))
														}
														variant={
															bedrooms == num.replace("+", "")
																? "default"
																: "outline"
														}>
														{num}
													</Button>
												))}
											</div>
										</div>

										<div className="flex flex-col space-y-2">
											<Label className="text-sm font-medium text-gray-900">
												Bathrooms
											</Label>
											<div className="flex flex-wrap gap-2">
												{["1+", "2+", "3+", "4+"].map((num) => (
													<Button
														key={num}
														onClick={() =>
															setBathrooms(num.replace("+", ""))
														}
														variant={
															bathrooms == num.replace("+", "")
																? "default"
																: "outline"
														}>
														{num}
													</Button>
												))}
											</div>
										</div>

										<div className="flex flex-col space-y-2">
											<span className="text-sm font-medium text-gray-900">
												Minimum Price
											</span>
											<DropdownMenu>
												<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
													{minPrice === "Minimum" ||
													minPrice === "Maximum"
														? minPrice
														: formatPrice(Number(minPrice))}
													<ChevronDown size={14} />
												</DropdownMenuTrigger>
												<DropdownMenuContent className="max-h-[200px] overflow-y-auto">
													<DropdownMenuRadioGroup
														value={minPrice}
														onValueChange={setMinPrice}>
														{priceList
															.filter((price) => {
																if (
																	maxPrice === "Maximum" ||
																	!maxPrice
																)
																	return true;
																if (price === "Maximum") return;
																if (price === "Minimum") return true;
																return (
																	parseInt(price) < parseInt(maxPrice)
																);
															})
															.map((price) => (
																<DropdownMenuRadioItem
																	key={price}
																	value={price}>
																	{price === "Minimum" ||
																	price === "Maximum"
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
														: formatPrice(Number(maxPrice))}{" "}
													<ChevronDown size={14} />
												</DropdownMenuTrigger>
												<DropdownMenuContent className="max-h-[200px] overflow-y-auto">
													<DropdownMenuRadioGroup
														value={maxPrice}
														onValueChange={setMaxPrice}>
														{priceList
															.filter((price) => {
																if (price === "Minimum") return false;
																if (
																	minPrice === "Minimum" ||
																	!minPrice
																)
																	return true;

																if (price === "Maximum") return true;

																return (
																	parseInt(price) >
																		parseInt(minPrice) ||
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
												Zipcode
											</Label>
											<Input
												type="text"
												value={postalCode}
												onChange={(e) =>
													setPostalCode(e.target.value)
												}
												className="text-sm"
												placeholder="Zipcode"
											/>
										</div>

										<div className="flex gap-2 w-full">
											<div className="flex w-full flex-col space-y-2">
												<Label className="text-sm font-medium text-gray-900">
													Min Year Built
												</Label>
												<Input
													type="text"
													value={minYearBuilt}
													onChange={(e) =>
														setMinYearBuilt(e.target.value)
													}
													className="text-sm"
													placeholder="Min Year"
												/>
											</div>

											<div className="flex w-full flex-col space-y-2">
												<Label className="text-sm font-medium text-gray-900">
													Max Year Built
												</Label>
												<Input
													type="text"
													value={maxYearBuilt}
													onChange={(e) =>
														setMaxYearBuilt(e.target.value)
													}
													className="text-sm"
													placeholder="Max Year"
												/>
											</div>
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
												placeholder="e.g. Pelican Bay"
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
												placeholder="e.g. Barron Collier High"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Actions - Fixed at bottom */}
				<div className="fixed bottom-0 left-0 right-0 z-[10000] p-4 bg-white border-t border-gray-200">
					{loading ? (
						<div className="flex justify-center items-center space-x-2">
							<LoaderIcon className="h-4 w-4 animate-spin text-primary-600" />
							<span className="text-sm text-primary font-medium">
								Applying filters...
							</span>
						</div>
					) : (
						<div className="flex justify-center w-full">
							<Button
								onClick={handleApplyFilters}
								className="w-full h-12 rounded-2xl">
								<Search className="w-4 h-4 mr-2" />
								Apply Filters
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
