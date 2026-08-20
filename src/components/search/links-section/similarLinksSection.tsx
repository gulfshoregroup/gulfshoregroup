import Link from "next/link";
import capitalizeWords from "@/hooks/capitalize-letter";

export default function SimilarLinksSection({
	property,
}: {
	property: any;
}) {
	const isHome = property.OwnershipDesc === "Single Family";
	const isCondo = property.OwnershipDesc === "Condo";
	const isLot = property.LotType === "Residential Lot";
	const WaterfrontYN = property.WaterfrontYN === "1";
	const PoolYN = property.PrivatePoolYN === "1";
	const GulfAccessYN = property.GulfAccessYN === "1";
	const isLand = isLot && !property.OwnershipDesc;
	const city = capitalizeWords(property.City);
	const community = capitalizeWords(property.DevelopmentName);
	const citySlug = capitalizeWords(property.City).replaceAll(
		/\s+/g,
		"-"
	);
	const communitySlug = capitalizeWords(
		property.DevelopmentName
	).replaceAll(/\s+/g, "-");

	const base = `/Florida-Real-Estate-Search${
		isLot
			? "/Residential-Lot"
			: isHome
			? "/Homes"
			: isCondo
			? "/Condos"
			: ""
	}/${citySlug && citySlug}/${
		communitySlug && communitySlug
	}`.replaceAll("//", "/");

	if (!property) return null;

	return (
		<section className="w-11/12 mx-auto px-4 my-10">
			<h2 className="text-xl font-semibold mb-4">
				{isCondo && "Explore Similar Condos"}
				{isHome && "Explore Similar Homes"}
				{isLot && "Explore Similar Residential Lots"}
			</h2>

			{(isCondo || isHome) && (
				<div className="grid gap-4 space-y-3 grid-cols-1  md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
					<Link
						href={`${base}/${Number(property.BedsTotal)}-beds`}
						className="text-blue-600 text-sm hover:underline md:font-medium ">
						{Number(property.BedsTotal)} Bedrooms{" "}
						{isHome ? "Single Family Homes" : "Condos"} for sale in{" "}
						{community} {city}, FL
					</Link>
					<Link
						href={`${base}/postalCode-${property.PostalCode}/${Number(
							property.BedsTotal
						)}-beds`}
						className="text-blue-600 text-sm hover:underline md:font-medium ">
						{Number(property.BedsTotal)} Bedrooms{" "}
						{isHome ? "Single Family Homes" : "Condos"} for sale in{" "}
						{property.PostalCode}, FL
					</Link>{" "}
					<Link
						href={`${base}/postalCode-${property.PostalCode}`}
						className="text-blue-600 text-sm hover:underline md:font-medium ">
						{isHome ? "Single Family Homes" : "Condos"} for sale in{" "}
						{property.PostalCode}, FL
					</Link>
					{WaterfrontYN && (
						<Link
							href={`${base}/keyword-waterfront`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Waterfront {isHome ? "Single Family Homes" : "Condos"}{" "}
							For Sale in {community} {city}, FL
						</Link>
					)}
					{PoolYN && (
						<Link
							href={`${base}/keyword-pool`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							{isHome ? "Single Family Homes" : "Condos"} with pool
							for sale in {community} {city}, FL
						</Link>
					)}{" "}
					{GulfAccessYN && (
						<Link
							href={`${base}/keyword-gulfaccess`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Gulf Access {isHome ? "Single Family Homes" : "Condos"}{" "}
							for sale in {community} {city}, FL
						</Link>
					)}
					{WaterfrontYN && (
						<Link
							href={`${base}/keyword-waterfront`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Waterfront {isHome ? "Single Family Homes" : "Condos"}{" "}
							for sale in {property.PostalCode}, FL
						</Link>
					)}
					{GulfAccessYN && (
						<Link
							href={`${base}/keyword-gulfaccess`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Gulf Access {isHome ? "Single Family Homes" : "Condos"}{" "}
							for sale in {property.PostalCode}, FL
						</Link>
					)}
				</div>
			)}

			{isLand && (
				<div className="grid gap-2 space-y-3 grid-cols-1  md:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
					<Link
						href={`${base}/postalCode-${property.PostalCode}`}
						className="text-blue-600 text-sm hover:underline md:font-medium ">
						Residential Lots for sale in {property.PostalCode}, FL
					</Link>
					{WaterfrontYN && (
						<Link
							href={`${base}/keyword-waterfront`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Waterfront Residential Lots {community} {city}, FL
						</Link>
					)}

					{GulfAccessYN && (
						<Link
							href={`${base}/keyword-gulfaccess`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Gulf Access Residential Lots for sale in {community}{" "}
							{city}, FL
						</Link>
					)}
					{WaterfrontYN && (
						<Link
							href={`${base}/postalCode-${property.PostalCode}/keyword-waterfront`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Waterfront Residential Lots for sale in{" "}
							{property.PostalCode}, FL
						</Link>
					)}
					{GulfAccessYN && (
						<Link
							href={`${base}/postalCode-${property.PostalCode}/keyword-gulfaccess`}
							className="text-blue-600 text-sm hover:underline md:font-medium ">
							Gulf Access Residential Lots for sale in{" "}
							{property.PostalCode}, FL
						</Link>
					)}
				</div>
			)}
		</section>
	);
}
