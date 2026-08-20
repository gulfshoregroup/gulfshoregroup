import Link from "next/link";
import capitalizeWords from "@/hooks/capitalize-letter";

export default function CityLinksSection({ city }: { city: string }) {
	// Beds filters

	const bedroom_keywords = [
		{
			label: "1 Bedroom Real Estate & Homes for sale in",
			slug: "1-beds",
		},
		{
			label: "2 Bedroom Real Estate & Homes for sale in",
			slug: "2-beds",
		},
		{
			label: "3 Bedroom Real Estate & Homes for sale in",
			slug: "3-beds",
		},
		{
			label: "4 Bedroom Real Estate & Homes for sale in",
			slug: "4-beds",
		},
		{
			label: "5 Bedroom Real Estate & Homes for sale in",
			slug: "5-beds",
		},
	];

	// Price filters
	const price_keywords = [
		{
			label: "Real Estate & Homes for sale Under $200k in",
			slug: "200000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $300k in",
			slug: "300000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $400k in",
			slug: "400000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $500k in",
			slug: "500000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $600k in",
			slug: "600000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $700k in",
			slug: "700000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $800k in",
			slug: "800000-maxPrice",
		},
		{
			label: "Real Estate & Homes for sale Under $900k in",
			slug: "900000-maxPrice",
		},
		{ label: "Luxury Homes $1M+ in", slug: "1000000-minPrice" },
	];

	// Amenities filters
	const amenity_keywords = [
		{
			label: "Waterfront Properties for sale in",
			slug: "keyword-waterfront",
		},
		{
			label: "Gulf Access Properties for sale in",
			slug: "keyword-gulfaccess",
		},
		{
			label: "Properties With Pool for sale in",
			slug: "keyword-pool",
		},
	];

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

	// Generates: `/naples/2-beds`
	const buildLink = (slug: string) =>
		`/Florida-Real-Estate-Search/${capitalizeWords(city).replaceAll(
			" ",
			"-"
		)}/${slug.replaceAll(" ", "-")}`;

	if (!city) return null;

	return (
		<section className="w-11/12 mx-auto px-4">
			<h2 className="text-xl font-semibold mb-4">
				Explore {capitalizeWords(city)} Real Estate
			</h2>

			<div className="grid gap-2 space-y-3 grid-cols-1  md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
				{/* Price */}
				<div>
					<h3 className="font-semibold mb-2">Search by Price</h3>
					<ul className="space-y-1">
						{price_keywords.map((item) => (
							<li key={item.slug}>
								<Link
									href={buildLink(item.slug)}
									className="text-blue-600 text-sm hover:underline md:font-medium ">
									{item.label} {capitalizeWords(city)}
								</Link>
							</li>
						))}
					</ul>
				</div>
				{/* Other Cities */}
				<div>
					<h3 className="font-semibold mb-2">Other Cities</h3>
					<ul className="space-y-1">
						{cities.map((item) => (
							<li key={item}>
								<Link
									href={`/Florida-Real-Estate-Search/${capitalizeWords(
										item
									).replaceAll(" ", "-")}`}
									className="text-blue-600 text-sm hover:underline md:font-medium ">
									Real Estate & Homes for sale in{" "}
									{capitalizeWords(item.replaceAll("-", " "))}
								</Link>
							</li>
						))}
					</ul>
				</div>

				{/* Bedrooms */}
				<div>
					<h3 className="font-semibold mb-2">Search by Bedrooms</h3>
					<ul className="space-y-1">
						{bedroom_keywords.map((item) => (
							<li key={item.slug}>
								<Link
									href={buildLink(item.slug)}
									className="text-blue-600 text-sm hover:underline md:font-medium ">
									{item.label} {capitalizeWords(city)}
								</Link>
							</li>
						))}
					</ul>
				</div>
				{/* Amenities */}
				<div>
					<h3 className="font-semibold mb-2">Search by Features</h3>
					<ul className="space-y-1">
						{amenity_keywords.map((item) => (
							<li key={item.slug}>
								<Link
									href={buildLink(item.slug)}
									className="text-blue-600 text-sm hover:underline md:font-medium ">
									{item.label} {capitalizeWords(city)}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
