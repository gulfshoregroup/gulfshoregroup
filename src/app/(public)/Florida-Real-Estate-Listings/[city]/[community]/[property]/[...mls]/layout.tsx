import { FetchProperty } from "@/DAL/FetchProperties";
import capitalizeWords from "@/hooks/capitalize-letter";
import { formatPrice } from "@/hooks/formatPrice";
import UrlMaker from "@/hooks/url-maker";
import { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ mls: string[] }>;
};

// Enhanced metadata generation with comprehensive SEO
export async function generateMetadata({
	params,
}: Props): Promise<Metadata> {
	const id = (await params).mls?.[0];

	const siteUrl = "https://gulfshoregroup.com";

	if (!id) {
		return redirect(
			`https://gulfshoregroup.com/Florida-Real-Estate-Search`
		);
	}

	try {
		const property = await FetchProperty(id);

		if (!property) {
			return {
				title: "Property Not Found | Gulfshore Group",
				description:
					"This property is not available. Explore other luxury real estate options in Florida.",
				robots: "noindex, nofollow",
			};
		}

		const propertytype =
			property.PropertyType === "Lot and Land"
				? "Land"
				: property.OwnershipDesc === "Single Family"
				? "Single Family Home"
				: property.OwnershipDesc;
		const city = capitalizeWords(property.City);
		const development = capitalizeWords(
			property.Development || property.DevelopmentName
		);
		const price = formatPrice(property.CurrentPrice);

		// Enhanced description for better SEO
		const descriptiontxt =
			propertytype === "Land"
				? `${Number(
						property.Acres
				  )} acres ${propertytype} for sale - ${
						property.PropertyAddress
				  }. ${Math.ceil(
						Number(property.Acres) * 43560
				  )} SQFT. Price: ${price} ${
						property.PrivatePoolYN === "1" ? ",Pool" : ""
				  }  ${property.PrivateSpaYN === "1" ? ",Spa" : ""} ${
						property.GulfAccessYN === "1" ? ",Gulf Access" : ""
				  } ${
						property.WaterfrontYN === "1" ? ",Waterfront" : ""
				  }. Contact for more details.`
				: `${propertytype} for sale - ${
						property.PropertyAddress
				  } with ${Number(property.BedsTotal)} beds and ${Number(
						property.BathsTotal
				  ).toFixed(1)} baths ${
						property.PrivatePoolYN === "1" ? ", Pool" : ""
				  }  ${property.PrivateSpaYN === "1" ? ", Spa" : ""} ${
						property.GulfAccessYN === "1" ? ", Gulf Access " : ""
				  } ${
						property.WaterfrontYN === "1" ? ", Waterfront" : ""
				  }. ${Number(property.ApproxLivingArea).toFixed(
						1
				  )} sqft. Price: ${price}. | Gulfshore Group.`;

		// SEO-optimized title
		const title = `${property.FullAddress} - Gulfshore Group`;

		// Enhanced images with proper alt text
		const images =
			property.AllPixList && property.AllPixList.length > 0
				? [
						{
							url: property.AllPixList[0].startsWith("http")
								? property.AllPixList[0]
								: `https://gulfshoregroup.com${property.AllPixList[0].startsWith("/") ? "" : "/"}${property.AllPixList[0]}`,
							width: 1920,
							height: 1080,
							alt: `${property.PropertyAddress} - image`,
						},
				  ]
				: [
						{
							url: "https://gulfshoregroup.com/logo.png",
							width: 1200,
							height: 630,
							alt: "Gulfshore Group - Florida Real Estate",
						},
				  ];

		const propertyLink = UrlMaker(
			property.City,
			property.Development || property.DevelopmentName,
			property.FullAddress,
			property.MLSNumber
		);

		const propertyUrl = `${siteUrl + propertyLink}`;

		return {
			title,
			description: descriptiontxt,
			keywords: [
				`${property.FullAddress}`,
				`${city} real estate`,
				`${development} homes`,
				`Florida property`,
				`${propertytype} for sale`,
				`MLS ${property.MLSNumber}`,
				`${city} homes`,
				`luxury real estate Florida`,
				`Gulfshore Group`,
				...(property.BedroomsTotal
					? [`${property.BedroomsTotal} bedroom homes`]
					: []),
				...(property.BathroomsFull
					? [`${property.BathroomsFull} bathroom homes`]
					: []),
			].join(", "),
			authors: [{ name: "Gulfshore Group" }],
			creator: "Gulfshore Group",
			publisher: "Gulfshore Group",
			category: "Real Estate",
			classification: "Real Estate Listing",

			openGraph: {
				title,
				description: descriptiontxt,
				url: propertyUrl,
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
				canonical: propertyUrl,
			},
		};
	} catch (error) {
		console.error("Error generating metadata:", error);
		return {
			title: "Error Loading Property | Gulfshore Group",
			description:
				"There was an error loading this property. Please try again or browse our other listings.",
			robots: "noindex, nofollow",
		};
	}
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<div className="min-h-[80dvh]">{children}</div>
		</>
	);
}

export const revalidate = 6400; // cache for 2 hours
