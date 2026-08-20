"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, LoaderIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import capitalizeWords from "@/hooks/capitalize-letter";
import Cities from "@/types/cities";
import ExtractSearchParams from "@/hooks/extractSearchParams";
import {
	buildQueryFromFilters,
	buildSearchPathWithLocation,
	parseFiltersFromSearchParams,
} from "@/lib/search-filters";

interface EditSearchModalProps {
	search: {
		_id: string;
		name: string;
		link: string;
		lastUpdated: string;
		filters: Record<string, any>;
		matchCount: number;
		icon: string;
		subscriptionEnabled?: boolean;
		subscriptionFrequency?: string;
	};
	isOpen: boolean;
	onClose: () => void;
	onUpdate: (updatedSearch: any) => void;
}

export const propertyTypeOptions = [
	{ value: "Homes", label: "Homes" },
	{ value: "Condos", label: "Condos" },
	{ value: "Residential-Lots", label: "Residential Lots" },
];

const featuresList = [
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
];

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

const getInitialFilters = async (link: string, filtersFromSearch: any) => {
	let f = { ...filtersFromSearch };
	if (link) {
		try {
			const url = new URL(link, "https://gulfshoregroup.com");
			const pathname = url.pathname;
			const searchParams = url.searchParams;

			const pathSegments = pathname.split("/").filter(Boolean);
			const baseIndex = pathSegments.indexOf("Florida-Real-Estate-Search");
			const slugs = baseIndex >= 0 ? pathSegments.slice(baseIndex + 1) : pathSegments;

			const pathFilters = await ExtractSearchParams(slugs);
			const queryFilters = parseFiltersFromSearchParams(searchParams);

			f = {
				...pathFilters,
				...queryFilters,
				...f,
			};
		} catch (e) {
			console.error("Error parsing link in EditSearchModal:", e);
		}
	}
	return f;
};

export default function EditSearchModal({
	search,
	isOpen,
	onClose,
	onUpdate,
}: EditSearchModalProps) {
	const [name, setName] = useState(search.name);
	const [subscriptionEnabled, setSubscriptionEnabled] = useState(true);
	const [subscriptionFrequency, setSubscriptionFrequency] = useState("Instant");

	// Filters states
	const [city, setCity] = useState("");
	const [developmentName, setDevelopmentName] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [minPrice, setMinPrice] = useState("Minimum");
	const [maxPrice, setMaxPrice] = useState("Maximum");
	const [bedrooms, setBedrooms] = useState("");
	const [bathrooms, setBathrooms] = useState("");
	const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
	const [features, setFeatures] = useState<string[]>([]);
	const [hoa, setHoa] = useState("Any");
	const [status, setStatus] = useState("Active");

	useEffect(() => {
		if (!isOpen) return;

		const loadFilters = async () => {
			const initial = await getInitialFilters(search.link, search.filters);

			setName(search.name || "");
			setCity(initial.city || "");
			setDevelopmentName(initial.developmentName || "");
			setPostalCode(initial.postalCode || "");
			setMinPrice(initial.minPrice || "Minimum");
			setMaxPrice(initial.maxPrice || "Maximum");
			setBedrooms(initial.beds || "");
			setBathrooms(initial.baths || "");
			setPropertyTypes(initial.propertyTypes || []);
			setFeatures(initial.features || []);
			setHoa(initial.hoa || "Any");
			setStatus(initial.status || "Active");
			setSubscriptionEnabled(search.subscriptionEnabled ?? true);
			setSubscriptionFrequency(search.subscriptionFrequency ?? "Instant");
		};

		loadFilters();
	}, [isOpen, search]);

	if (!isOpen) return null;

	const handleUpdate = () => {
		const nextFilters = {
			city: city || "",
			developmentName: developmentName || "",
			beds: bedrooms || "",
			baths: bathrooms || "",
			minPrice: minPrice === "Minimum" ? "" : minPrice,
			maxPrice: maxPrice === "Maximum" ? "" : maxPrice,
			postalCode: postalCode || "",
			propertyTypes: propertyTypes || [],
			features: features || [],
			hoa: hoa || "Any",
			status: status || "Active",
			page: "1",
		};

		const nextQuery = buildQueryFromFilters(nextFilters);
		const nextPath = buildSearchPathWithLocation({
			city: city || null,
			developmentName: developmentName || null,
		});
		const newLink = `https://gulfshoregroup.com${nextPath}?${nextQuery.toString()}`;

		onUpdate({
			...search,
			name,
			link: newLink,
			filters: nextFilters,
			subscriptionFrequency,
			subscriptionEnabled,
		});
		onClose();
	};

	return (
		<>
			<div
				className="fixed inset-0 bg-black/50 z-40"
				onClick={onClose}
			/>

			<div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
				<div>
					<h2 className="text-2xl font-bold text-foreground">
						Edit Saved Search
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						Customize search criteria and alert notification frequency.
					</p>
				</div>

				{/* Name input */}
				<div className="space-y-2">
					<Label className="text-sm font-semibold text-foreground">
						Search Title / Name
					</Label>
					<Input
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="border border-border bg-background text-foreground"
						placeholder="e.g. Naples Waterfront Homes"
					/>
				</div>

				{/* Filters grid */}
				<div className="border-t border-border pt-4">
					<h3 className="text-lg font-semibold text-foreground mb-4">
						Search Criteria
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* City */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">City</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{capitalizeWords(city.replaceAll("-", " ")) || "Select City"} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="px-3 py-2 max-h-[250px] overflow-y-auto bg-background border border-border">
									<DropdownMenuRadioGroup
										value={city}
										onValueChange={(value) => setCity(value)}
										className="flex flex-col">
										<DropdownMenuRadioItem value="" className="px-3 py-1.5 cursor-pointer">
											Any City
										</DropdownMenuRadioItem>
										{Cities.map((c) => (
											<DropdownMenuRadioItem key={c} value={c} className="px-3 py-1.5 cursor-pointer">
												{capitalizeWords(c.replaceAll("-", " "))}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Zipcode */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">Zipcode</Label>
							<Input
								value={postalCode}
								onChange={(e) => setPostalCode(e.target.value)}
								className="border border-border bg-background text-foreground p-2.5"
								placeholder="Zipcode"
							/>
						</div>

						{/* Min Price */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">Min Price</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{minPrice === "Minimum" || minPrice === "Maximum"
										? minPrice
										: formatPrice(Number(minPrice))} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="max-h-[250px] overflow-y-auto bg-background border border-border">
									<DropdownMenuRadioGroup
										value={minPrice}
										onValueChange={setMinPrice}>
										{priceList.map((p) => (
											<DropdownMenuRadioItem key={p} value={p} className="px-3 py-1.5 cursor-pointer">
												{p === "Minimum" || p === "Maximum"
													? p
													: formatPrice(Number(p))}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Max Price */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">Max Price</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{maxPrice === "Maximum"
										? "Maximum"
										: formatPrice(Number(maxPrice))} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="max-h-[250px] overflow-y-auto bg-background border border-border">
									<DropdownMenuRadioGroup
										value={maxPrice}
										onValueChange={setMaxPrice}>
										{priceList.map((p) => (
											<DropdownMenuRadioItem key={p} value={p} className="px-3 py-1.5 cursor-pointer">
												{p === "Minimum" || p === "Maximum"
													? p
													: formatPrice(Number(p))}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Bedrooms */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">Bedrooms</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{bedrooms ? bedrooms + "+" : "Bedrooms"} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="px-3 py-2 bg-background border border-border">
									<DropdownMenuRadioGroup
										value={bedrooms}
										onValueChange={setBedrooms}>
										<DropdownMenuRadioItem value="" className="px-3 py-1.5 cursor-pointer">
											Any Beds
										</DropdownMenuRadioItem>
										{["1", "2", "3", "4"].map((num) => (
											<DropdownMenuRadioItem key={num} value={num} className="px-3 py-1.5 cursor-pointer">
												{num}+ Beds
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Bathrooms */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">Bathrooms</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{bathrooms ? bathrooms + "+" : "Bathrooms"} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="px-3 py-2 bg-background border border-border">
									<DropdownMenuRadioGroup
										value={bathrooms}
										onValueChange={setBathrooms}>
										<DropdownMenuRadioItem value="" className="px-3 py-1.5 cursor-pointer">
											Any Baths
										</DropdownMenuRadioItem>
										{["1", "2", "3", "4"].map((num) => (
											<DropdownMenuRadioItem key={num} value={num} className="px-3 py-1.5 cursor-pointer">
												{num}+ Baths
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* HOA */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">HOA</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{hoa || "Any"} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="bg-background border border-border">
									<DropdownMenuRadioGroup value={hoa} onValueChange={setHoa}>
										{["Any", "Yes", "No"].map((v) => (
											<DropdownMenuRadioItem key={v} value={v} className="px-3 py-1.5 cursor-pointer">
												{v}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Status */}
						<div className="flex flex-col space-y-2">
							<Label className="text-sm font-semibold text-foreground">Listing Status</Label>
							<DropdownMenu>
								<DropdownMenuTrigger className="text-center border border-border bg-background text-foreground rounded-lg justify-between p-2.5 items-center inline-flex text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
									{status || "Active"} <ChevronDown className="w-4 h-4 ml-2" />
								</DropdownMenuTrigger>
								<DropdownMenuContent className="bg-background border border-border">
									<DropdownMenuRadioGroup value={status} onValueChange={setStatus}>
										{["Active", "Sold", "Pending", "Short Sale", "Foreclosure", "All"].map((v) => (
											<DropdownMenuRadioItem key={v} value={v} className="px-3 py-1.5 cursor-pointer">
												{v}
											</DropdownMenuRadioItem>
										))}
									</DropdownMenuRadioGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>

						{/* Property Type */}
						<div className="md:col-span-2 space-y-2">
							<Label className="text-sm font-semibold text-foreground">Property Type</Label>
							<div className="grid grid-cols-3 gap-2 border border-border p-3 rounded-lg bg-background">
								{propertyTypeOptions.map((type) => (
									<div key={type.value} className="flex items-center space-x-2">
										<Checkbox
											id={`modal-property-${type.value}`}
											checked={propertyTypes.includes(type.value)}
											onCheckedChange={(checked) =>
												setPropertyTypes((prev) =>
													checked
														? [...prev, type.value]
														: prev.filter((t) => t !== type.value)
												)
											}
										/>
										<label htmlFor={`modal-property-${type.value}`} className="text-sm font-medium text-foreground cursor-pointer select-none">
											{type.label}
										</label>
									</div>
								))}
							</div>
						</div>

						{/* Features */}
						<div className="md:col-span-2 space-y-2">
							<Label className="text-sm font-semibold text-foreground">Features</Label>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-border p-3 rounded-lg bg-background max-h-[150px] overflow-y-auto">
								{featuresList.map((f) => (
									<div key={f} className="flex items-center space-x-2">
										<Checkbox
											id={`modal-feature-${f}`}
											checked={features.includes(f)}
											onCheckedChange={(checked) =>
												setFeatures((prev) =>
													checked
														? [...prev, f]
														: prev.filter((item) => item !== f)
												)
											}
										/>
										<label htmlFor={`modal-feature-${f}`} className="text-sm font-medium text-foreground cursor-pointer select-none">
											{f}
										</label>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Subscription Settings */}
				<div className="space-y-4 border-t border-border pt-4">
					<h3 className="text-lg font-semibold text-foreground">
						Alert Notifications
					</h3>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold text-foreground">
								Email Alerts
							</span>
							<button
								onClick={() =>
									setSubscriptionEnabled(!subscriptionEnabled)
								}
								className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
									subscriptionEnabled ? "bg-blue-600" : "bg-gray-300"
								}`}>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										subscriptionEnabled
											? "translate-x-6"
											: "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>

					<div className="space-y-2">
						<select
							value={subscriptionFrequency}
							onChange={(e) =>
								setSubscriptionFrequency(e.target.value)
							}
							className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
							<option value="Instant">Instant</option>
							<option value="Daily">Daily</option>
							<option value="Weekly">Weekly</option>
						</select>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex justify-end gap-3 pt-4 border-t border-border">
					<Button
						onClick={onClose}
						variant="outline"
						className="border border-border text-foreground hover:bg-gray-100 bg-transparent">
						Cancel
					</Button>
					<Button
						onClick={handleUpdate}
						className="bg-blue-500 hover:bg-blue-600 text-white">
						Update
					</Button>
				</div>
			</div>
		</>
	);
}
