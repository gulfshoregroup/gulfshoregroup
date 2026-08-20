"use server";
import OwnerCard from "@/components/cards/property/ownerCard";
import SliderComponent from "@/components/global/slider";
import ListingLabels from "@/components/property/listingLabels";
import ReadMore from "@/components/property/readmore";
import SocialShare from "@/components/property/share-card";
import PropertySection from "@/components/property/propertysection/propertySlider";
import { WishListButton } from "@/components/property/wishlistButton";
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import capitalizeWords from "@/hooks/capitalize-letter";

import UrlMaker from "@/hooks/url-maker";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";

import {
	Bed,
	BathIcon,
	Expand,
	Calendar,
	Search,
} from "lucide-react";
import React, { Suspense } from "react";
import PropertyDetail from "./pageComponent";
import Link from "next/link";
import MortgageCalculator from "@/components/property/mortgage-card";
import fetchMetadataFromSlug from "@/DAL/FetchMetaData";
import Image from "next/image";
import { FetchProperty } from "@/DAL/FetchProperties";
import Footer from "@/components/global/footer";
import PropertyDetailsTable from "./infoTable";
import createRealEstateJsonLd from "@/hooks/getJsonSchema";
import SimilarLinksSection from "@/components/search/links-section/similarLinksSection";
import CityLinksSection from "@/components/search/links-section/cityLinksSection";
import { Property } from "@/app/generated/prisma/client";
import SimilarPropertiesCarousel from "@/components/property/similarPropertiesCarousel";
import WalkScore from "@/components/property/walkscore";

export default async function Listing({
	params,
}: {
	params: Promise<{ mls: string[] }>;
}) {
	const id = (await params).mls?.[0];
	const property: Property = await FetchProperty(id);

	// Handle case when property is not found
	if (!property) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold mb-4">
						Property Not Found
					</h1>
					<p className="text-gray-600 mb-4">
						The requested property could not be found.
					</p>
					<Link href="/" className="text-blue-600 hover:underline">
						Return to Home
					</Link>
				</div>
			</div>
		);
	}

	let media = (property.images ?? (property as any)?.raw?.Media) as any;
	if (typeof media === 'string') {
		try {
			media = JSON.parse(media);
		} catch (e) {
			media = [];
		}
	}
	let images: string[] = [];
	if (media && Array.isArray(media) && media.length > 0) {
		images = media
			.filter((item: any) => item.MediaCategory === "Photo")
			.map((item: any) => item.MediaURL);
	}

	const isValidField = (value: any) => {
		return (
			value !== null &&
			value !== undefined &&
			value !== "" &&
			value !== "No" &&
			value !== "0" &&
			value !== "none" &&
			value !== "N/A" &&
			value !== "None" &&
			value !== "0.00" &&
			value !== "0%" &&
			value !== "No Information"
		);
	};

	const city = capitalizeWords(property.City || "");
	const development = capitalizeWords(
		property.Community || (property.raw as any)?.MLSAreaMajor || ""
	);

	const Meta = await fetchMetadataFromSlug([
		property.City || "",
		development,
	]);

	const formattedCommunity = capitalizeWords(Meta?.community || development || property.Community || "").trim();
	const formattedCity = capitalizeWords(Meta?.city || property.City || "").trim();
	const headerTitle = formattedCommunity.toLowerCase() === formattedCity.toLowerCase() || !formattedCommunity || formattedCommunity.toLowerCase() === "others" || formattedCommunity.toLowerCase() === "other"
		? `${formattedCity}, FL`
		: `${formattedCommunity}, ${formattedCity} FL`;

	const jsonLd = createRealEstateJsonLd(property);
	return (
		<>
			<div className="mt-5 w-11/12 mx-auto">
				{/* Enhanced Breadcrumb with structured data */}
				<Breadcrumb className="my-4">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/">Home</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								href={`/Florida-Real-Estate-Search/${city}`.replaceAll(
									" ",
									"-"
								)}>
								{city}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink
								href={`/Florida-Real-Estate-Search/${city}/${development}`
									.replaceAll(" ", "-")
									.replaceAll("&", "And")}>
								{development}
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>
								{capitalizeWords(property.FullAddress).replace(
									" Fl",
									" FL"
								)}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<SliderComponent
					address={property.FullAddress || ""}
					images={images || []}
				/>

				<div className="w-full grid grid-cols-1 lg:grid-cols-[repeat(auto-fit,minmax(500px,1fr))] justify-between border-t-2 border-gray-200 xl:gap-5 items-center mt-4">
					<Card className="my-4 w-full h-full shadow-none border-l-2 border-gray-200 rounded-xl bg-white overflow-hidden">
						<CardContent className="p-6">
							{/* Header with labels and actions */}
							<div className="flex justify-between items-start mb-4">
								<ListingLabels
									CreatedDate={property.OnMarketDate || ""}
									Status={property.StandardStatus || ""}
									StatusType={property.StatusType || ""}
								/>
								<div className="flex gap-3 items-center">
									<div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
										<WishListButton propertyId={property.id} />
									</div>
									<div className="p-2 hover:bg-gray-100 rounded-full transition-colors">
										<SocialShare
											propertyUrl={UrlMaker(
												property.City,
												property.Development || "",
												property.FullAddress,
												property.MLSNumber
											)}
										/>
									</div>
								</div>
							</div>

							{/* Price with enhanced styling */}
							<div className="mb-3">
								<span className="text-3xl inline-flex gap-2 lg:text-4xl font-bold text-gray-900 tracking-tight">
									$
									{Number(property.ListPrice).toLocaleString("en-US")}{" "}
									{property.PropertyType === "Residential Lease" && (
										<span className="text-gray-800 my-auto h-full text-sm font-medium">
											- For Lease
										</span>
									)}
								</span>
							</div>

							{/* Property address with better typography */}
							<h1 className="text-lg lg:text-xl font-medium text-gray-700 mb-4 leading-relaxed">
								{(() => {
									const address = property.FullAddress || "";
									const city = property.City || "";
									const state = property.StateOrProvince || "FL";
									const zip = property.PostalCode || "";

									if (address.toLowerCase().includes(city.toLowerCase())) {
										return capitalizeWords(address).replace(" Fl", " FL");
									}
									return `${capitalizeWords(address)}, ${capitalizeWords(city)}, ${state} ${zip}`.trim().replace(/,\s*$/, "");
								})()}
							</h1>

							{/* Enhanced property features with improved layout */}
							<div className="w-full">
								{property.PropertyType !== "Lot and Land" ? (
									<div className="flex flex-wrap gap-4">
										<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
											<div className="p-2 rounded-full bg-blue-100 text-blue-600">
												<Bed className="w-5 h-5" />
											</div>
											<div>
												<div className="text-lg font-semibold text-gray-900">
													{Number(property.BedroomsTotal)}
												</div>
												<div className="text-sm text-gray-500">
													Beds
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
											<div className="p-2 rounded-full bg-green-100 text-green-600">
												<BathIcon className="w-5 h-5" />
											</div>
											<div>
												<div className="text-lg font-semibold text-gray-900">
													{Number(property.BathroomsFull)}
												</div>
												<div className="text-sm text-gray-500">
													Baths
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
											<div className="p-2 rounded-full bg-purple-100 text-purple-600">
												<Expand className="w-5 h-5" />
											</div>
											<div>
												<div className="text-lg font-semibold text-gray-900">
													{property.LivingArea ? Number(property.LivingArea).toLocaleString("en-US") : "N/A"}
												</div>
												<div className="text-sm text-gray-500">
													Sqft
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
											<div className="p-2 rounded-full bg-orange-100 text-orange-600">
												<Calendar className="w-5 h-5" />
											</div>
											<div>
												<div className="text-lg font-semibold text-gray-900">
													{property.YearBuilt}
												</div>
												<div className="text-sm text-gray-500">
													Built
												</div>
											</div>
										</div>
									</div>
								) : (
									<div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg max-w-xs">
										<div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
											<Expand className="w-5 h-5" />
										</div>
										<div></div>
									</div>
								)}
							</div>
						</CardContent>

						<CardFooter className="bg-gray-50 border-t border-gray-200 px-6 py-4">
							<div className="text-xs text-gray-600 leading-relaxed">
								<span className="font-medium">Source:</span>{" "}
								NAPLESMLS#
								{property.MLSNumber}
								<br />
								<span className="font-medium">
									Listing Office:
								</span>{" "}
								{property.ListOfficeName || (property.raw as any)?.ListOfficeName || "N/A"}
								<br />
								<span className="font-medium">
									Showing Office:
								</span>{" "}
								GULFSHORE GROUP
							</div>
						</CardFooter>
					</Card>
				</div>

				<div className="mx-auto w-full">
					<OwnerCard
						property={{
							propertyAddress: property.FullAddress,
							MLSNumber: property.MLSNumber,
						}}
					/>
				</div>
			</div>

			<div className="w-11/12 my-12 mx-auto">
				{/* <div className="mb-8">
					<Suspense>
						<WalkScore
							latitude={parseFloat(property.Latitude?.toString() || "")}
							longitude={parseFloat(property.Longitude?.toString() || "")}
							address={property.FullAddress}
						/>
					</Suspense>
				</div> */}
				<PropertyDetailsTable property={property} />
				<Suspense>
					<MortgageCalculator
						propertyPrice={Number(property.ListPrice)}
					/>
				</Suspense>
			</div>

			<Suspense>
				<PropertyDetail {...property} />
			</Suspense>
			<PropertySection
				props={
					<h2 className="py-4 px-2 font-semibold mt-10 lg:mt-12 text-lg lg:text-xl">
						Other Properties For Sale in{" "}
						<span className="text-primary">
							{(() => {
								const comm = (development || property.Community || "").trim();
								const cityStr = capitalizeWords(property.City || "").trim();
								if (!comm || comm.toLowerCase() === cityStr.toLowerCase() || comm.toLowerCase() === "others" || comm.toLowerCase() === "other") {
									return `${cityStr}, Florida`;
								}
								return `${capitalizeWords(comm)}, ${cityStr} Florida`;
							})()}
						</span>
					</h2>
				}
				queryParams={{
					city: property.City,
					developmentName: development || property.Community || "",
					sort: "ListPrice",
					limit: "12",
					order: "desc",
					excludeMLS: property.MLSNumber,
					propertyTypes: (() => {
						const subType = property.PropertySubType || "";
						const type = property.PropertyType || "";
						if (type === "Land" || type.includes("Lot") || type === "Lots & Land") return "Residential-Lots";
						if (subType === "Single Family Residence") return "Homes";
						if (subType.includes("Rise") || subType === "Townhouse" || type.includes("Condominium")) return "Condos";
						return "Homes";
					})(),
				}}
			/>

			{/* Only show city-wide section when community ≠ city to avoid duplicate listings.
			    e.g. "Marco Island" community in "Marco Island" city would show the same data twice.
			    But "Fiddler's Creek" in "Naples" correctly shows two distinct carousels. */}
			{(() => {
				const cityNorm = (property.City || "").trim().toLowerCase();
				const devNorm = development.trim().toLowerCase();
				// Hide 2nd section if: no development, OR development contains city name, OR city contains development name
				const isDuplicate =
					!devNorm ||
					devNorm === cityNorm ||
					devNorm.includes(cityNorm) ||
					cityNorm.includes(devNorm);
				if (isDuplicate) return null;
				return (
					<PropertySection
						props={
							<h2 className="py-4 px-2 font-semibold mt-10 lg:mt-12 text-lg lg:text-xl">
								Explore Properties in{" "}
								<span className="text-primary">
									{capitalizeWords(property.City)}, Florida
								</span>
							</h2>
						}
						queryParams={{
							sort: "CurrentPrice",
							order: "desc",
							limit: "5",
							city: property.City,
							excludeMLS: property.MLSNumber,
							propertyTypes: (() => {
								const subType = property.PropertySubType || "";
								const type = property.PropertyType || "";
								if (type === "Land" || type.includes("Lot") || type === "Lots & Land") return "Residential-Lots";
								if (subType === "Single Family Residence") return "Homes";
								if (subType.includes("Rise") || subType === "Townhouse" || type.includes("Condominium")) return "Condos";
								return "Homes";
							})(),
						}}
					/>
				);
			})()}

			<section className="mt-14 md:mt-16 lg:mt-20">
				<div className="mx-auto w-11/12">
					<div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
						<div className="flex flex-col items-center lg:flex-row">
							{/* Image Section */}
							<Link
								href={`/Florida-Real-Estate-Search/${capitalizeWords(
									property.City || "Naples"
								).replaceAll(" ", "-")}`}
								className="lg:w-2/5 relative group cursor-pointer block overflow-hidden">
								<div className="relative rounded-xl overflow-hidden lg:h-full">
									<Image
										className="w-full h-full rounded-2xl overflow-hidden object-cover group-hover:scale-105 transition-transform duration-500"
										width={450}
										height={400}
										alt={`${Meta?.city || property.City || "Florida"} city view`}
										src={Meta?.content?.Images?.[0] || "/map-bg.webp"}
									/>
									<div className="absolute h-full bottom-0 left-0 right-0 text-center bg-linear-to-t from-gray-900/80 via-black/60 to-transparent p-4 flex flex-col justify-end">
										<div className="flex flex-col items-center justify-end h-full pb-4">
											<span className="text-xl lg:text-3xl font-bold text-white leading-tight drop-shadow-md">
												{headerTitle}
											</span>
											<span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-xs font-semibold text-white transition-colors">
												Explore Area Map & Listings →
											</span>
										</div>
									</div>
								</div>
							</Link>

							{/* Content Section */}
							<div className="lg:w-3/5 p-6 sm:p-8 lg:p-10">
								<div className="flex flex-col h-full justify-center">
									<div className="space-y-4">
										<div className="flex items-center space-x-2">
											<div className="w-1 h-8 bg-accent rounded-full"></div>
											<h2 className="text-2xl lg:text-4xl font-bold text-primary leading-tight">
												{headerTitle}
											</h2>
										</div>

										<div className="prose prose-gray max-w-none lg:max-h-[480px] overflow-y-auto">
											{Meta?.content?.infoText && Meta.content.infoText.trim().length > 0 && (
												<ReadMore className="text-gray-500 leading-relaxed">
													{Meta.content.infoText
															.replaceAll("*", "")
															.replaceAll("###", "•")
															.replaceAll("##", "•")
															.replaceAll("#", "")}
												</ReadMore>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<div className="my-5 mx-auto w-11/12">
				<span className="font-semibold text-sm">Disclaimer:</span>
				<span className="text-xs font-light text-gray-600">
					The source of this real property information is the
					copyrighted and proprietary database compilation of the
					M.L.S. of Naples, Inc. Copyright M.L.S. of Naples, Inc. All
					rights reserved. The accuracy of this information is not
					warranted or guaranteed. This information should be
					independently verified if any person intends to engage in a
					transaction in reliance upon it.
				</span>
			</div>
			{(property as any).similar && (property as any).similar.length > 0 && (
				<SimilarPropertiesCarousel
					properties={(property as any).similar}
					development={development}
				/>
			)}

			<SimilarLinksSection property={property} />
			<CityLinksSection city={property.City} />
			<Footer />
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
		</>
	);
}
