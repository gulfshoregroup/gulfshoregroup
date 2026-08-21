export const dynamic = "force-dynamic";
import React, { Suspense } from "react";
import prisma from "@/lib/prisma";
import AreaInfoComponent from "../../areaInfoComponent";
import capitalizeWords from "@/hooks/capitalize-letter";
import CommunityListingsTabs from "./communityListingsTabs";
import MarketReportSection from "@/components/search/marketReportSection";
import type { Metadata } from "next";

export async function generateMetadata({
	params,
}: {
	params: { city: string; community: string };
}): Promise<Metadata> {
	const city = decodeURIComponent((await params).city || "");
	const community = decodeURIComponent(
		(await params).community || ""
	);

	// Capitalize for cleaner titles
	const formattedCity = city.replace(/\b\w/g, (c) => c.toUpperCase());
	const formattedCommunity = community.replace(/\b\w/g, (c) =>
		c.toUpperCase()
	);

	const title = `${formattedCommunity} Homes for Sale in ${formattedCity}, FL | Gulfshore Group Real Estate`;
	const description = `Explore luxury homes, condos, and properties for sale in ${formattedCommunity}, ${formattedCity}, Florida. View photos, property details, and updated MLS listings with Gulfshore Group — your trusted local real estate experts.`;
	const keywords = `
	${formattedCommunity} homes for sale,
	${formattedCommunity} real estate listings,
	${formattedCommunity} condos for sale,
	${formattedCity} homes for sale,
	${formattedCity} real estate,
	${formattedCity} condos for sale,
	luxury homes in ${formattedCity},
	Florida real estate,
	Southwest Florida homes,
	${formattedCommunity} waterfront homes,
	${formattedCommunity} golf community,
	Gulfshore Group ${formattedCity}
	`;

	return {
		title,
		description,
		keywords,
		alternates: {
			canonical: `https://gulfshoregroup.com/explore/${city}/${community}`,
		},
		openGraph: {
			title,
			description,
			url: `https://gulfshoregroup.com/explore/${city}/${community}`,
			siteName: "Gulfshore Group",
			images: [
				{
					url: "https://gulfshoregroup.com/logo.png",
					alt: `${formattedCommunity} Homes for Sale in ${formattedCity}`,
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

async function ExploreCommunity({
	params,
}: {
	params: {
		city: string;
		community: string;
	};
}) {
	const city = decodeURIComponent((await params).city).replaceAll(
		"-",
		" "
	);
	const community = decodeURIComponent(
		(await params).community
	).replaceAll("-", " ");
	const formattedCity = city.replace(/\b\w/g, (c) => c.toUpperCase());
	const formattedCommunity = community.replace(/\b\w/g, (c) =>
		c.toUpperCase()
	);

	// Fetch community from DB for marketing content (description, images, videos)
	const communityData = await prisma.community.findFirst({
		where: { 
			// Fallback slug matching
			name: { equals: formattedCommunity }
		}
	});

	return (
		<div>
			<AreaInfoComponent
				city={formattedCity}
				community={formattedCommunity}
			/>
			<div className="w-11/12 max-w-[1600px] mx-auto py-2">
				<MarketReportSection 
					city={formattedCity} 
					community={formattedCommunity} 
				/>
			</div>
			
			<div className="w-11/12 max-w-[1600px] mx-auto py-12">
			<Suspense>
				<div className="container mx-auto px-4 py-8">
					<CommunityListingsTabs
						city={city}
						community={community}
						formattedCity={formattedCity}
						formattedCommunity={formattedCommunity}
					/>
				</div>
			</Suspense>
			</div>
		</div>
	);
}

export default ExploreCommunity;
