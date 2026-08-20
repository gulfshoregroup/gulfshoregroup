"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, LoaderIcon, Settings2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import capitalizeWords from "@/hooks/capitalize-letter";
import axios from "axios";
import { toast } from "sonner";
import ExtractSearchParams from "@/hooks/extractSearchParams";
import Cities from "@/data/cities";

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

export const propertyTypeOptions = [
	{ value: "Homes", label: "Homes" },
	{ value: "Condos", label: "Condos" },
	{ value: "Residential-Lots", label: "Residential Lots" },
];

const formatPrice = (price: number) => {
	if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
	if (price >= 1000) return `$${(price / 1000).toFixed(0)}k`;
	return `$${price}`;
};

export const Filters = ({
	savedSearch,
	onSave,
}: {
	savedSearch: any;
	onSave: any;
}) => {
	const [loading, setLoading] = useState(false);
	const router = useRouter();
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
	const [postalCode, setPostalCode] = useState("");

	// Initialize states from savedSearch
	useEffect(() => {
		if (!savedSearch?.filters) return;

		const f = savedSearch.filters;
		setCity(f.city || "");
		setBedrooms(f.beds || "");
		setBathrooms(f.baths || "");
		setMinPrice(f.minPrice || "Minimum");
		setMaxPrice(f.maxPrice || "Maximum");
		setMinYearBuilt(f.builtYearMin || "");
		setMaxYearBuilt(f.builtYearMax || "");
		setPostalCode(f.postalCode || "");
		setPropertyType(f.propertyTypes || []);
		setKeywords(f.features || []);
	}, [savedSearch]);

	// Save search (PUT)
	const handleSaveSearchSubmit = async () => {
		try {
			setLoading(true);

			let url = "/Florida-Real-Estate-Search";
			const citySlug = city
				? encodeURIComponent(city.toLowerCase().replaceAll(" ", "-"))
				: "";

			if (propertyType.length === 1) {
				url += `/${propertyType[0]}/${citySlug}`;
			} else if (propertyType.length > 1) {
				const typesString = propertyType.join(",");
				url += `/${citySlug}/propertyTypes=${typesString}`;
			} else {
				url += `/${citySlug}`;
			}

			const segments: string[] = [];
			if (bedrooms) segments.push(`${bedrooms}-beds`);
			if (bathrooms) segments.push(`${bathrooms}-baths`);
			if (minPrice && minPrice !== "Minimum")
				segments.push(`${minPrice}-minPrice`);
			if (maxPrice && maxPrice !== "Maximum")
				segments.push(`${maxPrice}-maxPrice`);
			if (postalCode) segments.push(`${postalCode}-postalCode`);
			if (minYearBuilt) segments.push(`${minYearBuilt}-minBuiltYear`);
			if (maxYearBuilt) segments.push(`${maxYearBuilt}-maxBuiltYear`);
			if (keywords.includes("Waterfront"))
				segments.push("keyword-waterfront");
			if (keywords.includes("Gulf Access"))
				segments.push("keyword-gulfaccess");
			if (keywords.includes("Pool")) segments.push("keyword-pool");

			if (segments.length) url += "/" + segments.join("/");

			const filters = await ExtractSearchParams(url.split("/"));
			const link = `https://gulfshoregroup.com${url}`;
			const name =
				`${filters.city || ""} ${
					filters.propertyTypes?.join(", ") || ""
				}`.trim() || "My Saved Search";

			await axios.put(`/api/saved-searches/${savedSearch._id}`, {
				filters,
				link,
				name,
			});

			toast.success("Search updated successfully!", {
				description: "Your saved search has been updated.",
			});
			router.refresh();
			onSave();
		} catch (err) {
			toast.error("Failed to save search");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog>
			<DialogTrigger className="px-4 py-2 border h-8 md:h-10 border-gray-200 rounded-lg md:inline-flex hidden lg:flex justify-center text-center items-center gap-1">
				<Settings2 size={16} /> <span>Edit</span>
			</DialogTrigger>

			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Edit Saved Search</DialogTitle>
				</DialogHeader>

				{/* Filters Grid */}
				<div className="grid grid-cols-2 gap-6 my-3">
					{/* City */}
					<div className="flex flex-col space-y-2">
						<Label>City</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 items-center inline-flex text-sm">
								{city || "Select City"} <ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="px-3 py-2 max-h-[300px] overflow-y-auto">
								<DropdownMenuRadioGroup
									value={city}
									onValueChange={(value) => setCity(value)}>
									{Cities.map((c) => (
										<DropdownMenuRadioItem key={c} value={c}>
											{capitalizeWords(c.replaceAll("-", " "))}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Zipcode */}
					<div className="flex flex-col space-y-2">
						<Label>Zipcode</Label>
						<Input
							value={postalCode}
							onChange={(e) => setPostalCode(e.target.value)}
							placeholder="Zipcode"
						/>
					</div>

					{/* Prices */}
					<div className="flex flex-col space-y-2">
						<Label>Min Price</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 inline-flex text-sm">
								{minPrice === "Minimum"
									? "Minimum"
									: formatPrice(+minPrice)}{" "}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
								<DropdownMenuRadioGroup
									value={minPrice}
									onValueChange={setMinPrice}>
									{priceList.map((p) => (
										<DropdownMenuRadioItem key={p} value={p}>
											{p === "Minimum" || p === "Maximum"
												? p
												: formatPrice(+p)}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex flex-col space-y-2">
						<Label>Max Price</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 inline-flex text-sm">
								{maxPrice === "Maximum"
									? "Maximum"
									: formatPrice(+maxPrice)}{" "}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="max-h-[300px] overflow-y-auto">
								<DropdownMenuRadioGroup
									value={maxPrice}
									onValueChange={setMaxPrice}>
									{priceList.map((p) => (
										<DropdownMenuRadioItem key={p} value={p}>
											{p === "Minimum" || p === "Maximum"
												? p
												: formatPrice(+p)}
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Bedrooms & Bathrooms */}
					<div className="flex flex-col space-y-2">
						<Label>Bedrooms</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 inline-flex text-sm">
								{bedrooms ? bedrooms + "+" : "Bedrooms"}{" "}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="px-3 py-2">
								<DropdownMenuRadioGroup
									value={bedrooms}
									onValueChange={(v) => setBedrooms(v)}>
									{["1", "2", "3", "4"].map((num) => (
										<DropdownMenuRadioItem key={num} value={num}>
											{num}+
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					<div className="flex flex-col space-y-2">
						<Label>Bathrooms</Label>
						<DropdownMenu>
							<DropdownMenuTrigger className="text-center border rounded-lg justify-between p-2 inline-flex text-sm">
								{bathrooms ? bathrooms + "+" : "Bathrooms"}{" "}
								<ChevronDown size={14} />
							</DropdownMenuTrigger>
							<DropdownMenuContent className="px-3 py-2">
								<DropdownMenuRadioGroup
									value={bathrooms}
									onValueChange={(v) => setBathrooms(v)}>
									{["1", "2", "3", "4"].map((num) => (
										<DropdownMenuRadioItem key={num} value={num}>
											{num}+
										</DropdownMenuRadioItem>
									))}
								</DropdownMenuRadioGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{/* Property Type */}
					<div className="col-span-2">
						<Label className="my-2">Property Type</Label>
						<div className="grid grid-cols-3 gap-3">
							{propertyTypeOptions.map((type) => (
								<div
									key={type.value}
									className="flex items-center space-x-2">
									<Checkbox
										id={type.value}
										value={type.value}
										checked={propertyType.includes(type.value)}
										onCheckedChange={(checked) =>
											setPropertyType((prev) =>
												checked
													? [...prev, type.value]
													: prev.filter((t) => t !== type.value)
											)
										}
									/>
									<label htmlFor={type.value}>{type.label}</label>
								</div>
							))}
						</div>
					</div>

					{/* Features */}
					<div className="col-span-2">
						<Label className="my-2">Features</Label>
						<div className="grid grid-cols-3 gap-3">
							{["Gulf Access", "Waterfront", "Pool"].map((f) => (
								<div key={f} className="flex items-center space-x-2">
									<Checkbox
										id={f}
										value={f}
										checked={keywords.includes(f)}
										onCheckedChange={(checked) =>
											setKeywords((prev) =>
												checked
													? [...prev, f]
													: prev.filter((k) => k !== f)
											)
										}
									/>
									<label htmlFor={f}>{f}</label>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3 mt-4">
					<Button
						onClick={handleSaveSearchSubmit}
						disabled={loading}
						className="bg-blue-500 hover:bg-blue-600">
						{loading ? (
							<div className="flex items-center gap-2">
								<LoaderIcon className="h-4 w-4 animate-spin" />{" "}
								Saving...
							</div>
						) : (
							"Save Search"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
