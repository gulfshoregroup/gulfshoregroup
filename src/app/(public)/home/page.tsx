import CitiesSection from "@/components/city/cities-section";
import Footer from "@/components/global/footer";
import Hero from "@/components/home/hero-section";
import WhyChooseUs from "@/components/home/whyus-section";
import { Suspense } from "react";
import FeaturesSection from "@/components/home/features-section";
import AboutSection from "@/components/about-section";
import type { Metadata } from "next";
import PropertySection from "@/components/property/propertysection/propertySlider";
import BlogSection from "@/components/blogs/blogSection";
import CityFAQ from "@/components/city/city-faq";

import ReviewsSection from "@/components/home/scrollingReviewSection";
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

export default async function Home() {
	return (
		<>
			<Hero />
			<PropertySection
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
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "RealEstateAgent",
						name: "Gulfshore Group",
						url: "https://gulfshoregroup.com",
						telephone: "+1-239-992-9119",
						email: "mailbox@gulfshoregroup.com",
						address: {
							"@type": "PostalAddress",
							addressLocality: "Naples",
							addressRegion: "FL",
							postalCode: "34102",
							addressCountry: "US",
						},
					}),
				}}
			/>
			{/* <SubscribeCard /> */}
			<Footer />
		</>
	);
}
