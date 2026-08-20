import Home from "./home/page";
import { Metadata } from "next";

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

export default async function page() {
	return <Home />;
}
