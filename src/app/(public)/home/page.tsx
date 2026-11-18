import CitiesSection from "@/components/city/cities-section";
import Footer from "@/components/global/footer";
import Hero from "@/components/home/hero-section";
import { Suspense } from "react";
import type { Metadata } from "next";
import PropertySection from "@/components/property/propertysection/propertySlider";
import { getFeaturedProperties } from "@/lib/properties/getFeaturedProperties";
import dynamic from "next/dynamic";

// Below-the-fold dynamic imports for minimal initial JS execution (TBT < 150ms)
// Flood tool JS loads only when scrolled near (see lazyFloodZoneLookup.tsx).
import FloodZoneLookup from "@/components/property/lazyFloodZoneLookup";
const ReviewsSection = dynamic(
	() => import("@/components/home/scrollingReviewSection")
);
const WhyChooseUs = dynamic(
	() => import("@/components/home/whyus-section")
);
const FeaturesSection = dynamic(
	() => import("@/components/home/features-section")
);
const AboutSection = dynamic(
	() => import("@/components/about-section")
);
const BlogSection = dynamic(
	() => import("@/components/blogs/blogSection")
);
// Server component (no client JS) — imported directly, not via dynamic().
import CityFAQ from "@/components/city/city-faq";
// Enhanced metadata generation with comprehensive SEO
export async function generateMetadata(): Promise<Metadata> {
	const siteUrl = "https://gulfshoregroup.com";
	const title = "Naples Florida Real Estate Office - GULFSHORE GROUP";

	const descriptiontxt =
		"Gulfshore Group Naples Florida Real Estate Office For Naples Florida Real Estate Properties and Surrounding Area. Find Condos, Homes and Vacant Land.";
	const images = [
		{
			url: "https://gulfshoregroup.com/logo.png",
			alt: "Gulfshore Group Logo",
			width: 1200,
			height: 630,
		},
	];
	try {
		return {
			title,
			description: descriptiontxt,
			keywords:
				" Florida real estate, Gulfshore Group, homes for sale, luxury properties, Florida listings, real estate search",
			authors: [{ name: "Gulfshore Group" }],
			creator: "Gulfshore Group",
			publisher: "Gulfshore Group",
			category: "Real Estate",
			classification: "Real Estate Listing",

			openGraph: {
				title,
				description: descriptiontxt,
				url: siteUrl,
				siteName: "Gulfshore Group",
				images,
				type: "website",
				locale: "en_US",
			},
			twitter: {
				card: "summary_large_image",
				title,
				description: descriptiontxt,
				images: images.map((img: any) => img.url),
				creator: "@GulfshoreGroup",
				site: "@GulfshoreGroup",
			},

			robots: {
				index: true,
				follow: true,
				googleBot: {
					index: true,
					follow: true,
					"max-video-preview": -1,
					"max-image-preview": "large",
					"max-snippet": -1,
				},
			},

			other: {
				"msapplication-TileColor": "#da532c",
				"theme-color": "#ffffff",
			},
			alternates: {
				canonical: siteUrl,
			},
		};
	} catch (error) {
		console.error("Error generating metadata:", error);
		return {
			title: "Error Loading | Gulfshore Group",
			description:
				"There was an error loading. Please try again or browse our other listings.",
		};
	}
}

export const revalidate = 180; // ISR: revalidate every 3 minutes for instant edge TTFB

export default async function Home() {
	const latestProperties = await getFeaturedProperties();

	return (
		<>
			<Hero />
			<PropertySection
				initialProperties={latestProperties}
				props={
					<>
						<div className="flex flex-col text-start items-start pb-5 justify-start">
							<h2 className="lg:text-2xl text-xl pt-10 lg:pt-12 text-start font-medium">
								{"Latest Listings In And Around "}
								<span className="text-primary font-bold">
									Naples, Florida
								</span>
							</h2>
							<p className="py-1 lg:text-base md:text-sm text-xs lg:font-medium font-semibold text-gray-700">
								Discover Naples Latest Listings And Surrounding Area
							</p>
						</div>
					</>
				}
				queryParams={{
					sort: "OnMarketTimestamp",
					limit: "8",
					order: "desc",
					minPrice: "500000",
				}}
			/>

			<div className="bg-white rounded-t-xl mt-10">
				<div className="flex flex-col text-start items-start justify-start px-4 md:px-6 ">
					<div className="items-start justify-start flex	 md:ml-10 flex-col">
						<h2 className="lg:text-2xl text-xl text-start font-medium lg:font-medium">
							Search By City
						</h2>
						<p className="py-2 text-start text-xs md:text-sm lg:font-medium font-semibold lg:text-base text-gray-700">
							Explore Active Listings in each{" "}
							<span className="text-primary font-semibold">
								SW Florida City
							</span>
							.
						</p>
					</div>
				</div>
				<Suspense>
					<CitiesSection />
				</Suspense>
			</div>

			{/* FEMA Flood Zone Lookup Section (Requested after Search by City) */}
			<div className="w-11/12 max-w-[1400px] mx-auto my-12">
				<div className="max-w-3xl mx-auto">
					<Suspense fallback={<div className="h-[250px] w-full rounded-xl bg-gray-100 animate-pulse" />}>
						<FloodZoneLookup />
					</Suspense>
				</div>
			</div>

				<ReviewsSection />
			<WhyChooseUs />
			<FeaturesSection />
		
			
			<div className="mt-10 -mb-10 mx-auto">
				<div className="max-w-11/12 lg:max-w-4/5 mx-auto ">
					<span className="lg:text-2xl text-lg font-medium text-start">
						About Gulfshore Group
					</span>
				</div>
				<AboutSection />
			</div>
            <BlogSection category="others" title="Real Estate Blogs" subtitle="Tips, trends, and insights from real estate experts" />
            {/* <BlogSection category="facebook" title="Social Updates" subtitle="Latest market updates from our social media" /> */}
			<CityFAQ city="Naples" />
			<script
				async
				id="structured-data"
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					// Entity data for Google + AI engines. TODO(dev): add streetAddress,
					// geo, openingHours and sameAs (Google Business Profile, Facebook,
					// Instagram, LinkedIn, Zillow/Realtor.com agent profiles).
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@graph": [
							{
								"@type": "RealEstateAgent",
								"@id": "https://gulfshoregroup.com/#organization",
								name: "Gulfshore Group",
								url: "https://gulfshoregroup.com",
								logo: "https://gulfshoregroup.com/logo.png",
								image: "https://gulfshoregroup.com/logo.png",
								telephone: "+1-239-992-9119",
								email: "mailbox@gulfshoregroup.com",
								priceRange: "$$$",
								address: {
									"@type": "PostalAddress",
									addressLocality: "Naples",
									addressRegion: "FL",
									postalCode: "34102",
									addressCountry: "US",
								},
								areaServed: [
									"Naples", "Marco Island", "Bonita Springs", "Estero",
									"Fort Myers", "Fort Myers Beach", "Cape Coral", "Sanibel",
									"Captiva", "Lehigh Acres", "Ave Maria", "Immokalee",
									"Babcock Ranch", "Miromar Lakes",
								].map((name) => ({
									"@type": "City",
									name: `${name}, FL`,
								})),
								knowsAbout: [
									"Southwest Florida real estate",
									"Naples luxury homes",
									"Waterfront and Gulf access homes",
									"Golf community real estate",
									"Condos for sale in Naples FL",
									"FEMA flood zones in Collier and Lee County",
								],
							},
							{
								"@type": "WebSite",
								"@id": "https://gulfshoregroup.com/#website",
								url: "https://gulfshoregroup.com",
								name: "Gulfshore Group",
								publisher: { "@id": "https://gulfshoregroup.com/#organization" },
								potentialAction: {
									"@type": "SearchAction",
									target: "https://gulfshoregroup.com/Florida-Real-Estate-Search?q={search_term_string}",
									"query-input": "required name=search_term_string",
								},
							},
						],
					}),
				}}
			/>
			{/* <SubscribeCard /> */}
			<Footer />
		</>
	);
}
