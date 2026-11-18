import { FetchProperty } from "@/DAL/FetchProperties";
import capitalizeWords from "@/hooks/capitalize-letter";
import {
	getListingDescription,
	getListingImageUrls,
	getListingTitle,
	getListingUrl,
	SITE_URL,
} from "@/lib/seo/listing";
import { Metadata } from "next";
import { redirect } from "next/navigation";

type Props = {
	params: Promise<{ mls: string[] }>;
};

const OFF_MARKET = ["Withdrawn", "Canceled", "Expired", "Off Market", "Off-Market"];

// Listing metadata. Reads the CURRENT Prisma Property fields (see src/lib/seo/listing.ts).
export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const id = (await params).mls?.[0];

	if (!id) {
		return redirect(`${SITE_URL}/Florida-Real-Estate-Search`);
	}

	try {
		const property = await FetchProperty(id);

		if (!property) {
			return {
				title: "Property Not Found | Gulfshore Group",
				description:
					"This property is not available. Explore other homes, condos and land for sale in Southwest Florida.",
				robots: { index: false, follow: true },
			};
		}

		const title = getListingTitle(property);
		const description = getListingDescription(property);
		const propertyUrl = getListingUrl(property);
		const city = capitalizeWords(property.City || "");
		const community = capitalizeWords(property.Community || "");
		const photos = getListingImageUrls(property, 4);

		const images = photos.length
			? photos.map((url) => ({
					url,
					alt: `${property.FullAddress}, ${city} FL`,
			  }))
			: [
					{
						url: `${SITE_URL}/logo.png`,
						alt: "Gulfshore Group - Southwest Florida Real Estate",
					},
			  ];

		// Sold / withdrawn listings stay crawlable (follow) but are not indexed,
		// so Google's index only holds listings that are actually for sale.
		const isOffMarket = OFF_MARKET.includes(property.StandardStatus || "");

		return {
			title: { absolute: `${title} | Gulfshore Group` },
			description,
			keywords: [
				`${city} real estate`,
				community ? `${community} homes for sale` : null,
				`${city} homes for sale`,
				`MLS ${property.MLSNumber || property.ListingId}`,
			]
				.filter(Boolean)
				.join(", "),
			openGraph: {
				title,
				description,
				url: propertyUrl,
				siteName: "Gulfshore Group",
				images,
				type: "website",
				locale: "en_US",
			},
			twitter: {
				card: "summary_large_image",
				title,
				description,
				images: images.map((img) => img.url),
				site: "@GulfshoreGroup",
			},
			robots: isOffMarket
				? { index: false, follow: true }
				: {
						index: true,
						follow: true,
						googleBot: {
							index: true,
							follow: true,
							"max-image-preview": "large",
							"max-snippet": -1,
						},
				  },
			alternates: {
				canonical: propertyUrl,
			},
		};
	} catch (error) {
		console.error("Error generating metadata:", error);
		return {
			title: "Florida Real Estate Listing | Gulfshore Group",
			description:
				"Homes, condos and land for sale in Naples and Southwest Florida.",
		};
	}
}

export default function ListingLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <div className="min-h-[80dvh]">{children}</div>;
}
