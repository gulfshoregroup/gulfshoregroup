import capitalizeWords from "@/hooks/capitalize-letter";
import { Search } from "lucide-react";
import React from "react";

const cities = [
	"NAPLES",
	"BONITA SPRINGS",
	"ESTERO",
	"AVE MARIA",
	"MARCO ISLAND",
	"FORT MYERS",
	"BABCOCK RANCH",
	"LEHIGH ACRES",
	"IMMOKALEE",
	"SANIBEL",
	"CAPE CORAL",
];

export default function SearchSuggestions() {
	return (
		<div className="w-11/12 lg:w-4/5 mx-auto text-blue-600">
			<section>
				<h2 className="lg:text-lg font-medium px-4 pt-10 text-gray-900 mb-2">
					Search Single Family Homes for Sale by City:
				</h2>
				<div className="grid gap-1 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:font-medium grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
					{cities.map((city) => (
						<a
							key={city}
							href={`/Florida-Real-Estate-Search/Homes/${capitalizeWords(
								city
							).replaceAll(" ", "-")}`}
							className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
							<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
							<span className="font-normal lg:font-medium">
								Single Family Homes For Sale in{" "}
								{capitalizeWords(city)}
							</span>
						</a>
					))}
				</div>
			</section>

			<section className="my-4">
				<h2 className="lg:text-lg font-medium px-4 pt-3 text-gray-900  mb-2">
					Search Condos for Sale by City:
				</h2>
				<div className="grid gap-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:font-medium grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
					{cities.map((city) => (
						<a
							key={city}
							href={`/Florida-Real-Estate-Search/Condos/${capitalizeWords(
								city
							).replaceAll(" ", "-")}`}
							className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start hover:underline">
							<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
							<span className="font-normal lg:font-medium">
								Condos For Sale in {capitalizeWords(city)}
							</span>
						</a>
					))}
				</div>
			</section>

			<section className="my-4">
				<h2 className="lg:text-lg font-medium px-4 pt-3 text-gray-900  mb-2">
					Search Residential Lots for Sale by City:
				</h2>
				<div className="grid gap-2 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:font-medium  grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
					{cities.map((city) => (
						<a
							key={city}
							href={`/Florida-Real-Estate-Search/Residential-Lots/${capitalizeWords(
								city
							).replaceAll(" ", "-")}`}
							className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
							<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
							<span className="font-normal lg:font-medium">
								Residential Lots For Sale in {capitalizeWords(city)}
							</span>
						</a>
					))}
				</div>
			</section>
		</div>
	);
}
