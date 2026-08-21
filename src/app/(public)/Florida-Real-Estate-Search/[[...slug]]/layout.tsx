import type { Metadata } from "next";
import Footer from "@/components/global/footer";
import ReadMore from "@/components/property/readmore";
import StickySearchBar from "@/components/search/stickySearchBar";
import SearchLayoutClient from "../search-layout-client";
import Image from "next/image";
import ExtractSearchParams from "@/hooks/extractSearchParams";
import LazyCommunitySection from "@/components/city/lazyCommunitySection";
import { Suspense } from "react";
import GetSeoData from "@/hooks/getSeoData";
import { Search } from "lucide-react";
import { formatPrice } from "@/hooks/formatPrice";
import UrlMaker from "@/hooks/url-maker";
import Script from "next/script";
import CityLinksSection from "@/components/search/links-section/cityLinksSection";
import capitalizeWords from "@/hooks/capitalize-letter";
import MarketReportSection from "@/components/search/marketReportSection";
import GolfCourseCard from "@/components/community/GolfCourseCard";
type Props = {
	params: Promise<{ slug?: string[] }>;
};

export async function generateMetadata({
	params,
}: Props): Promise<Metadata> {
	const slugs = (await params).slug;
	const filtersParams = await ExtractSearchParams(slugs);
	try {
		const meta = await GetSeoData({ params: filtersParams });

		return {
			title: meta.title,
			description: meta.description,
			keywords: meta.keywords,
			alternates: {
				canonical: `https://gulfshoregroup.com/Florida-Real-Estate-Search${
					meta.canonicalUrl.replaceAll("//", "/") || ""
				}`,
			},
			openGraph: {
				title: meta.title,
				description: meta.description,
				url: "https://gulfshoregroup.com",
				siteName: "Gulfshore Group",
				images: [
					{
						url:
							meta.content.Images?.[0] ||
							"https://gulfshoregroup.com/logo.png",
						alt: meta.title,
					},
				],
			},
		};
	} catch (error) {
		return {
			title:
				"Search Condos, Homes and Vacant Land. - GULFSHORE GROUP",
			description:
				"Search Condos, Homes and Vacant Land In Naples Florida and Surrounding Area. Find Latest Real Estate Properties and Listings In Naples Florida and Surrounding Area.",
			keywords:
				"SWFlorida Real-estate, Homes For Sale in Naples Florida, Homes For Sale in Southwest florida, Southwest florida Realestate, homes in southwest florida, florida real-estate, real-estate",

			openGraph: {
				title:
					"Search Condos, Homes and Vacant Land. - GULFSHORE GROUP",
				description:
					"Search Condos, Homes and Vacant Land In Naples Florida and Surrounding Area. Find Latest Real Estate Properties and Listings In Naples Florida and Surrounding Area.",
				url: "https://gulfshoregroup.com",
				siteName: "Gulfshore Group",
				images: [
					{
						url: "https://gulfshoregroup.com/logo.png",
						alt: "Gulfshore Group Logo",
					},
				],
			},
		};
	}
}
export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{
		slug?: string[];
	}>;
}>) {
	const slugs = (await params).slug || [];
	const filtersParams = await ExtractSearchParams(slugs);
	let seoData;
	try {
		seoData = await GetSeoData({
			params: filtersParams,
		});
	} catch (error) {
		console.error("Error fetching SEO data:", error);
		seoData = {
			title: "Search Properties in Florida",
			description: "Search Real Estate and Homes for sale.",
			heading: "Listings in Florida",
			keywords: "real estate, homes, condos",
			jsonld: {},
			total: 0,
			content: {
				Images: [],
				infoText: "Discover beautiful real estate listings. Explore properties with Gulfshore Group.",
				defaultImage: "",
			},
			city: filtersParams.city || "",
			community: filtersParams.community || "",
			similar: [],
			canonicalUrl: "",
		};
	}

	return (
		<>
			<StickySearchBar />
			<div className="w-full">
				<SearchLayoutClient filterParams={filtersParams}>
						<div
							id="container"
							className="min-h-full w-full">
							<div>{children}</div>

							<div className="w-11/12 max-w-[1600px] mx-auto">
								<MarketReportSection
									city={seoData?.city || filtersParams?.city || undefined}
									community={seoData?.community || filtersParams?.community || undefined}
								/>
							</div>

							{seoData.city && (
								<Suspense>
									<LazyCommunitySection city={seoData.city} />
								</Suspense>
							)}

							<div>
								<section className="mt-14 container mx-auto md:mt-16 lg:mt-20">
									<div className="mx-auto lg:px-8 px-4 sm:px-6">
										<div className="rounded-2xl w-full overflow-hidden border border-gray-100 shadow-sm">
											<div className="w-full overflow-hidden items-center grid gap-3 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(330px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
												{/* Image Section */}
												<div className="w-full relative overflow-hidden">
													<div className="relative rounded-xl overflow-hidden lg:h-full">
														<Image
															className="w-full h-full rounded-2xl overflow-hidden object-cover"
															width={500}
															height={500}
															loading="lazy"
															alt={`${filtersParams.city || "Florida"} Real Estate For Sale`}
															src={
																seoData?.content?.defaultImage || "/map-bg.webp"
															}
														/>
														<div className="absolute h-full bottom-0 left-0 right-0 text-center bg-linear-to-tr to-gray-800/60 via-black/50 from-black">
															<div className="flex flex-col items-start justify-end h-full">
																<span className="text-xl px-5 pb-6 lg:text-3xl font-bold text-white inline-flex items-center leading-tight">
																	<div className="w-1 h-8 bg-accent rounded-full mr-2"></div>
																	{seoData?.community || filtersParams.community || filtersParams.city || "Florida"} FL
																</span>
															</div>
														</div>
													</div>
												</div>

												{/* Content Section */}
												<div className="p-6 sm:p-8 lg:p-10">
													<div className="flex flex-col h-full justify-center">
														<div className="space-y-4">
															<div className="flex items-center space-x-2">
																<div className="w-1 h-8 bg-accent rounded-full"></div>
																<h2 className="text-2xl lg:text-4xl font-bold text-primary leading-tight">
																	{seoData?.community || filtersParams.community || filtersParams.city || "Florida"} FL
																</h2>
															</div>

															<div className="prose prose-gray max-w-none lg:max-h-[500px] overflow-y-auto pr-2 prose-p:text-gray-500 prose-headings:text-primary custom-scrollbar">
																{seoData?.content?.infoText && seoData.content.infoText.trim().length > 0 ? (
																	<div 
																		className="text-gray-500 leading-relaxed space-y-4"
																		dangerouslySetInnerHTML={{ __html: seoData.content.infoText }} 
																	/>
																) : (
																	<ReadMore className="text-gray-500 leading-relaxed">
																		{(seoData?.community || filtersParams.developmentName)
																			? `Welcome to ${seoData?.community || capitalizeWords(filtersParams.developmentName || "")} in ${capitalizeWords(filtersParams.city || "Naples")}, Florida. An exceptional community offering a premier lifestyle with access to world-class amenities and the natural beauty of Southwest Florida's Gulf Coast.`
																			: `${capitalizeWords(filtersParams.city || "Naples")}, Florida: Your Gateway to Paradise Living\n\nNestled along Florida's pristine Gulf Coast, ${capitalizeWords(filtersParams.city || "Naples")} represents the epitome of luxury living, combining world-class amenities with natural beauty that captivates residents and visitors alike. This enchanting city has evolved from a small fishing village into one of America's most desirable destinations for those seeking an exceptional quality of life.`}
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

								{/* Golf Courses Section */}
								{seoData?.content?.golfCourses && seoData.content.golfCourses.length > 0 && (
									<section className="mt-8 container mx-auto lg:px-8 px-4 sm:px-6">
										<div className="w-full mx-auto pt-12 border-t border-gray-200">
											<h2 className={`text-3xl font-serif text-primary mb-8 ${seoData.content.golfCourses.length === 1 ? 'text-center' : ''}`}>
												Golf Courses at {seoData?.community || filtersParams.community || filtersParams.city}
											</h2>
											<div className={`grid grid-cols-1 ${seoData.content.golfCourses.length === 1 ? 'max-w-2xl mx-auto' : 'xl:grid-cols-2'} gap-8`}>
												{seoData.content.golfCourses.map((course: any, idx: number) => (
													<GolfCourseCard key={idx} course={course} />
												))}
											</div>
										</div>
									</section>
								)}

								<div className="w-11/12 max-w-[1600px] mt-20 mb-8 mx-auto px-4">
									<span className="font-semibold text-sm">
										Disclaimer:
									</span>
									<span className="text-xs font-light text-gray-600">
										The source of this real property information is
										the copyrighted and proprietary database
										compilation of the M.L.S. of Naples, Inc.
										Copyright M.L.S. of Naples, Inc. All rights
										reserved. The accuracy of this information is not
										warranted or guaranteed. This information should
										be independently verified if any person intends to
										engage in a transaction in reliance upon it.
									</span>
								</div>
								{seoData.similar && seoData.similar && (
									<section className="my-4 w-11/12 mx-auto">
										<h2 className="lg:text-lg font-medium px-4 pt-3 text-gray-900 lg:font-semibold mb-2">
											Explore More Listings in{" "}
											{seoData.community || ""} {seoData.city || ""}{" "}
											FL:
										</h2>
										<div className="grid gap-2 grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
											{seoData.similar.map(
												(similar: any, i: number) => (
													<a
														key={i}
														target="_blank"
														href={UrlMaker(
															similar.City,
															similar.Community,
															similar.FullAddress,
															similar.MLSNumber
														)}
														className="inline-flex gap-1 items-center px-2 lg:py-3 py-2 text-sm text-start font-medium  hover:underline">
														<Search size={20} />{" "}
														<span className=" lg:font-medium text-blue-600 md:font-normal">
															{similar.FullAddress} -{" "}
															{formatPrice(Number(similar.ListPrice))}
														</span>
													</a>
												)
											)}
										</div>
									</section>
								)}
								<CityLinksSection city={seoData.city} />

								<Script
									id="jsonld-realestate"
									type="application/ld+json"
									strategy="afterInteractive"
									dangerouslySetInnerHTML={{
										__html: JSON.stringify(seoData.jsonld),
									}}
								/>
								<Footer />
							</div>
						</div>
				</SearchLayoutClient>
			</div>
		</>
	);
}
