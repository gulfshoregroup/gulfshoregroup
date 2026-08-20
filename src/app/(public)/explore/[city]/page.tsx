import PropertySection from "@/components/property/propertysection/propertySlider";
import capitalizeWords from "@/hooks/capitalize-letter";
import AreaInfoComponent from "../areaInfoComponent";
import GetSeoData from "@/hooks/getSeoData";
import { Suspense } from "react";
import LazyCommunitySection from "@/components/city/lazyCommunitySection";
import { Search } from "lucide-react";
import Script from "next/script";
import { formatPrice } from "@/hooks/formatPrice";
import UrlMaker from "@/hooks/url-maker";
import CityLinksSection from "@/components/search/links-section/cityLinksSection";
import MarketReportSection from "@/components/search/marketReportSection";

import type { Metadata } from "next";

export async function generateMetadata({
	params,
}: {
	params: { city: string };
}): Promise<Metadata> {
	const param = await params;
	const city = decodeURIComponent(param.city || "");

	// Capitalize for cleaner titles
	const formattedCity = city.replace(/\b\w/g, (c) => c.toUpperCase());

	const title = ` Homes for Sale in ${formattedCity}, FL | Gulfshore Group Real Estate`;
	const description = `Explore luxury homes, condos, and properties for sale in ${formattedCity}, Florida. View photos, property details, and updated MLS listings with Gulfshore Group — your trusted local real estate experts.`;
	const keywords = `
	 homes for sale,
	 real estate listings,
	 condos for sale,
	${formattedCity} homes for sale,
	${formattedCity} real estate,
	${formattedCity} condos for sale,
	luxury homes in ${formattedCity},
	Florida real estate,
	Southwest Florida homes,
	 waterfront homes,
	 golf community,
	Gulfshore Group ${formattedCity}
	`;

	return {
		title,
		description,
		keywords,
		alternates: {
			canonical: `https://gulfshoregroup.com/explore/${city}`,
		},
		openGraph: {
			title,
			description,
			url: `https://gulfshoregroup.com/explore/${city}`,
			siteName: "Gulfshore Group",
			images: [
				{
					url: "https://gulfshoregroup.com/logo.png",
					alt: ` Homes for Sale in ${formattedCity}`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: ["https://gulfshoregroup.com/logo.png"],
		},
	};
}

async function ExploreCity({
	params,
}: {
	params: {
		city: string;
	};
}) {
	const city = (await params).city;
	const seoData = await GetSeoData({
		params: {
			city,
			developmentName: null,
			beds: "",
			baths: "",
			minPrice: "",
			maxPrice: "",
			builtYearMin: "",
			builtYearMax: "",
			sort: "",
			order: "",
			propertyTypes: [],
			postalCode: "",
			page: "",
			features: [],
		},
	});
	return (
		<>
			<AreaInfoComponent city={city} />
			<div className="w-11/12 max-w-[1600px] mx-auto py-2">
				<MarketReportSection city={decodeURIComponent(city)} />
			</div>
			<div className="flex flex-col gap-10">
				<PropertySection
					props={
						<div className="items-start mt-4 justify-start flex flex-col">
							<h2 className="lg:text-2xl text-xl text-start font-medium lg:font-medium">
								Latest Listings in{" "}
								<span className="text-primary font-bold">
									{capitalizeWords(city)}, Florida
								</span>
							</h2>
							<p className="py-2 text-start text-xs md:text-sm lg:font-medium font-semibold lg:text-base text-gray-700">
								Explore Latest Listings in
								<span className="text-primary font-semibold">
									{capitalizeWords(city)}, Florida
								</span>
								.
							</p>
						</div>
					}
					queryParams={{
						city,
						order: "asc",
						sort: "CreatedDate",
					}}
				/>
				<PropertySection
					props={
						<div className="items-start mt-4 justify-start flex flex-col">
							<h2 className="lg:text-2xl text-xl text-start font-medium lg:font-medium">
								Homes For Sale in{" "}
								<span className="text-primary font-bold">
									{capitalizeWords(city)}, Florida
								</span>
							</h2>
							<p className="py-2 text-start text-xs md:text-sm lg:font-medium font-semibold lg:text-base text-gray-700">
								Explore Homes for sale in{" "}
								<span className="text-primary font-semibold">
									{city}, Florida
								</span>
								.
							</p>
						</div>
					}
					queryParams={{
						city,
						propertyTypes: ["Homes"],
					}}
				/>
				<PropertySection
					props={
						<div className="items-start mt-4 justify-start flex flex-col">
							<h2 className="lg:text-2xl text-xl text-start font-medium lg:font-medium">
								Waterfront Homes & Real Estate For Sale in{" "}
								<span className="text-primary font-bold">
									{capitalizeWords(city)}, Florida
								</span>
							</h2>
							<p className="py-2 text-start text-xs md:text-sm lg:font-medium font-semibold lg:text-base text-gray-700">
								Explore Waterfront Homes & Real Estate for sale in{" "}
								<span className="text-primary font-semibold">
									{city}, Florida
								</span>
								.
							</p>
						</div>
					}
					queryParams={{
						city,
						features: ["waterfront"],
					}}
				/>{" "}
				<PropertySection
					props={
						<div className="items-start mt-4 justify-start flex flex-col">
							<h2 className="lg:text-2xl text-xl text-start font-medium lg:font-medium">
								Homes & Real Estate For Sale in{" "}
								<span className="text-primary font-bold">
									{capitalizeWords(city)}, Florida{" "}
								</span>
								Under 1M
							</h2>
							<p className="py-2 text-start text-xs md:text-sm lg:font-medium font-semibold lg:text-base text-gray-700">
								Explore Waterfront Homes & Real Estate for sale in{" "}
								<span className="text-primary font-semibold">
									{city}, Florida{" "}
								</span>
								Under 1M.
							</p>
						</div>
					}
					queryParams={{
						city,
						maxPrice: "1000000",
					}}
				/>{" "}
			</div>
			{seoData.city && (
				<Suspense>
					<LazyCommunitySection city={seoData.city} />
				</Suspense>
			)}
			{seoData.similar && seoData.similar && (
				<section className="my-4 w-11/12 mx-auto">
					<h2 className="lg:text-lg font-medium px-4 pt-3 text-gray-900 lg:font-semibold mb-2">
						Explore More Listings in {seoData.community || ""}{" "}
						{seoData.city || ""} FL:
					</h2>
					<div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
						{seoData.similar.map((similar: any, i: number) => (
							<a
								key={i}
								target="_blank"
								href={UrlMaker(
									similar.City,
									similar.DevelopmentName,
									similar.PropertyAddress
								)}
								className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
								<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
								<span className=" lg:font-medium text-blue-600 md:font-normal">
									{similar.FullAddress} -{" "}
									{formatPrice(Number(similar.CurrentPrice))}
								</span>
							</a>
						))}
					</div>
				</section>
			)}
			<section className="my-4 w-11/12 mx-auto">
				<h2 className="lg:text-lg font-medium px-4 pt-3 text-gray-900 lg:font-semibold mb-2">
					Explore More Properties in {seoData.city}:
				</h2>
				<div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
					<a
						href={`/Florida-Real-Estate-Search/${seoData.city}/keyword-pool`}
						className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
						<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
						<span className=" lg:font-medium text-blue-600 md:font-normal">
							Homes & Real Estate with Pool for Sale in {seoData.city}
						</span>
					</a>
					{seoData.community && (
						<>
							<a
								href={`/Florida-Real-Estate-Search/Homes/${seoData.community}/${seoData.city}`}
								className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
								<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
								<span className=" lg:font-medium text-blue-600 md:font-normal">
									Single Family Homes for Sale in {seoData.community}{" "}
									{seoData.city}
								</span>
							</a>{" "}
							<a
								href={`/Florida-Real-Estate-Search/${seoData.city}/${seoData.community}/keyword-waterfront`}
								className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
								<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
								<span className=" lg:font-medium text-blue-600 md:font-normal">
									Waterfront Homes and Real Estate for Sale in{" "}
									{seoData.community} {seoData.city}
								</span>
							</a>
							<a
								href={`/Florida-Real-Estate-Search/${seoData.city}/${seoData.community}/keyword-pool`}
								className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
								<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
								<span className=" lg:font-medium text-blue-600 md:font-normal">
									Homes with Pool for Sale in {seoData.community}{" "}
									{seoData.city}
								</span>
							</a>
							<a
								href={`/Florida-Real-Estate-Search/${seoData.city}/${seoData.community}/keyword-gulfaccess`}
								className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
								<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
								<span className=" lg:font-medium text-blue-600 md:font-normal">
									Gulf Access Properties for Sale in{" "}
									{seoData.community}
									{seoData.city}
								</span>
							</a>
						</>
					)}
					<a
						href={`/Florida-Real-Estate-Search/${seoData.city}/keyword-gulfaccess`}
						className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
						<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
						<span className=" lg:font-medium text-blue-600 md:font-normal">
							Gulf Access Properties for Sale in {seoData.city}
						</span>
					</a>
					<a
						href={`/Florida-Real-Estate-Search/${seoData.city}/keyword-waterfront`}
						className="inline-flex gap-1 items-start px-2 lg:py-3 py-2 text-sm text-start font-medium hover:underline">
						<Search size={20} className="flex-shrink-0 mt-[2px]" />{" "}
						<span className=" lg:font-medium text-blue-600 md:font-normal">
							Waterfront Homes & Real Estate in {seoData.city}
						</span>
					</a>
				</div>
			</section>

			<CityLinksSection city={seoData.city} />

			<Script
				id="jsonld-realestate"
				type="application/ld+json"
				strategy="afterInteractive"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(seoData.jsonld),
				}}
			/>
		</>
	);
}

export default ExploreCity;
