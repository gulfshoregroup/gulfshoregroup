"use client";
import React from "react";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchBox from "./searchField";

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

const cities = [
	"Bonita-Springs",
	"Cape-Coral",
	"Estero",
	"Fort-Myers",
	"Immokalee",
	"Ave-Maria",
	"Babcock-Ranch",
	"Lehigh-Acres",
	"Marco-Island",
	"Naples",
	"Sanibel",
	"Pine Island",
];

function SearchComponent() {
	const [loading, setLoading] = React.useState(false);
	const [city, setCity] = React.useState<string>("");
	const [priceRange, setPriceRange] = React.useState<string>("");
	const [propertyType, setPropertyType] = React.useState<string>("");
	let min = "";
	let max = "";
	const handleSearch = ({
		isMapSearch = false,
	}: {
		isMapSearch?: boolean;
	}) => {
		setLoading(true);
		if (priceRange) {
			const prices = priceRange.split("-");
			min = prices[0];
			max = prices[1] || "";
		}

		const searchUrl = `/Florida-Real-Estate-Search/${
			propertyType ? propertyType + "/" : ""
		}${city ? city + "/" : ""}${min ? min + "-minPrice" + "/" : ""}${
			max ? max + "-maxPrice" + "/" : ""
		}${isMapSearch ? "?view=map" : ""}`;

		router.push(searchUrl);
	};

	const router = useRouter();
	return (
		
			<SearchBox />
	);
}

export default SearchComponent;
