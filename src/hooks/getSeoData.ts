import capitalizeWords from "./capitalize-letter";
import { SearchParamsResult } from "./extractSearchParams";
import prisma from "@/lib/prisma";
import { formatPrice } from "./formatPrice";
import UrlMaker from "./url-maker";

export default async function GetSeoData({
	params,
}: {
	params: SearchParamsResult;
}) {
	const city = params.city
		? capitalizeWords(params.city.replaceAll(/[^a-zA-Z0-9&]+/g, " "))
		: "";
	const community = params.developmentName
		? capitalizeWords(
				params.developmentName.replaceAll(/[^a-zA-Z0-9&]+/g, " ")
		  )
		: "";

	const where: any = { StandardStatus: "Active" };
	let content: { Images: string[]; infoText: string; defaultImage: string; golfCourses?: any; isGolfCommunity?: boolean } = {
		Images: [],
		infoText: "",
		defaultImage: "",
		golfCourses: null,
		isGolfCommunity: false,
	};
	let dbSeo = { title: "", metaDescription: "", keywords: "" };

	// --- City info ---
	if (params.city) {
		const cityName = decodeURIComponent(params.city).trim();
		where.City = {
			equals: cityName,
		};

		// Fetch the city record from Prisma
		const cityRecord = await prisma.city.findFirst({
			where: {
				name: {
					equals: cityName,
				},
			},
		});

		if (cityRecord) {
			let infoText = cityRecord.description || "";
			try {
				if (infoText.startsWith("{")) {
					const parsed = JSON.parse(infoText);
					infoText = parsed.infoText || "";
					dbSeo.title = parsed.title || "";
					dbSeo.metaDescription = parsed.metaDescription || "";
					dbSeo.keywords = parsed.keywords || "";
				}
			} catch (e) {}

			content = {
				Images: (cityRecord.images as any) || [],
				infoText: infoText,
				defaultImage: cityRecord.defaultImage || "",
			};
		}
	}

	// --- Community ---
	if (params.developmentName) {
		const devName = decodeURIComponent(params.developmentName).trim();
		where.OR = [
			{ Development: { equals: devName } },
			{ Community: { equals: devName } },
		];

		const communityRecord = await prisma.community.findFirst({
			where: {
				name: {
					equals: devName.toUpperCase(),
				},
			},
		});

		if (communityRecord) {
			content.golfCourses = communityRecord.golfCourses || null;
			content.isGolfCommunity = communityRecord.isGolfCommunity || false;
			content.Images = (communityRecord.images as any) || [];
			content.defaultImage = communityRecord.defaultImage || "";

			if (communityRecord.description) {
				let infoText = communityRecord.description;
				try {
					if (infoText.startsWith("{")) {
						const parsed = JSON.parse(infoText);
						infoText = parsed.infoText || "";
						dbSeo.title = parsed.title || dbSeo.title;
						dbSeo.metaDescription = parsed.metaDescription || dbSeo.metaDescription;
						dbSeo.keywords = parsed.keywords || dbSeo.keywords;
					}
				} catch (e) {}
				content.infoText = infoText;
			}
		}
	}

	// --- Total Listings ---
	const total = await prisma.property.count({ where });

	// --- Similar Listings (8 random or latest active) ---
	const page = Number(params.page) || 1;
	let skipNum = (page + 1) * 18;
	if (skipNum > total) skipNum = 1;

	const similarRaw = await prisma.property.findMany({
		where,
		select: {
			id: true,
			City: true,
			Community: true,
			Development: true,
			FullAddress: true,
			MLSNumber: true,
			ListPrice: true,
			Latitude: true,
			Longitude: true,
		},
		skip: skipNum,
		take: 8,
	});

	const similar = similarRaw.map((prop: any) => ({
		...prop,
		_id: prop.id,
		PropertyAddress: prop.FullAddress,
		CurrentPrice: prop.ListPrice || 0,
		DevelopmentName: prop.Community || prop.Development || "",
	}));

	// --- Dynamic Segments ---
	const cityPart = city ? `${city}, FL` : "Florida";

	const bedBath =
		params.beds || params.baths
			? ` with ${params.beds || ""}${params.beds ? " bedroom" : ""}${
					params.baths ? ` and ${params.baths} bath` : ""
			  }`
			: "";

	const priceSegment =
		params.minPrice && params.maxPrice
			? ` from ${formatPrice(+params.minPrice)} to ${formatPrice(
					+params.maxPrice
			  )}`
			: params.maxPrice
			? ` under ${formatPrice(+params.maxPrice)}`
			: params.minPrice
			? ` above ${formatPrice(+params.minPrice)}`
			: "";

	const featuresSegment =
		params.features && params.features.length > 1
			? ` featuring ${params.features.join(", ")}`
			: "";
	const featureSegment =
		params.features && params.features.length === 1
			? `${capitalizeWords(params.features[0]).replace(
					"Gulfaccess",
					"Gulf Access"
			  )} `
			: "";

	const typeSegment =
		params.propertyTypes && params.propertyTypes.length > 0
			? `${params.propertyTypes.join(", ")} for sale`
			: "Real Estate & Homes for sale";

	// --- Title ---
	let title = `${featureSegment}${typeSegment} in ${
		community ? community + " " : ""
	}${cityPart}${priceSegment}`;
	if (title.length > 70)
		title = `${featureSegment}${typeSegment} - ${
			community ? community + " " : ""
		}${cityPart}`.replace("for sale", "");

	// --- Description ---
	let description = `We have total ${total} ${featureSegment}${typeSegment} ${
		community ? community + ", " : ""
	}${cityPart}${bedBath}${featuresSegment}. Search ${featureSegment}${typeSegment}${priceSegment} in ${
		community ? community + ", " : ""
	}${cityPart}`;

	// --- H1 Heading ---
	const heading = `${featureSegment}${
		community || city ? "" : "Florida"
	} ${typeSegment} ${
		community || city
			? "in " + `${community && community + " "}` + city + ", FL"
			: ""
	}`.trim();

	// --- Keywords ---
	const keywords = [
		city,
		community,
		...(params.propertyTypes || []),
		params.beds && `${params.beds}-bedroom homes`,
		params.baths && `${params.baths}-bath homes`,
		...(params.features || []),
		"Florida real estate",
		"homes for sale",
		"condos for sale",
		"lots for sale",
		"Gulfshore Group",
	]
		.filter(Boolean)
		.join(", ");

	// --- Related Listings (for JSON-LD) ---
	const relatedListings = similar.map((prop, i) => ({
		"@type": "ListItem",
		url: `https://gulfshoregroup.com${UrlMaker(
			prop.City,
			prop.DevelopmentName,
			prop.PropertyAddress
		)}`,
		position: i + 1,
		item: {
			"@type": "RealEstateListing",
			name: `${prop.PropertyAddress}, ${prop.City}`,
			address: {
				"@type": "PostalAddress",
				streetAddress: prop.PropertyAddress,
				addressLocality: prop.City,
				addressRegion: "FL",
				addressCountry: "US",
			},
			offers: {
				"@type": "Offer",
				price: prop.CurrentPrice
					? formatPrice(prop.CurrentPrice)
					: undefined,
				priceCurrency: "USD",
				availability: "http://schema.org/InStock",
				itemOffered: {
					"@type": "RealEstateListing",
					streetAddress: prop.PropertyAddress,
					addressLocality: prop.City,
					addressRegion: "FL",
					addressCountry: "US",
					geo: {
						"@type": "GeoCoordinates",
						latitude: prop.Latitude,
						longitude: prop.Longitude,
					},
				},
			},
		},
	}));

	// --- JSON-LD Structured Data ---
	const jsonld = {
		"@context": "https://schema.org",
		"@type": "ItemList",
		name: title,
		description,
		itemListElement: relatedListings,
		provider: {
			"@type": "Organization",
			name: "Gulfshore Group",
			url: "https://gulfshoregroup.com",
			logo: "https://gulfshoregroup.com/logo.png",
			telephone: "+1-239-992-9119",
			email: "mailbox@gulfshoregroup.com",
			address: {
				"@type": "PostalAddress",
				addressLocality: "Naples",
				addressRegion: "FL",
				postalCode: "34102",
				addressCountry: "US",
			},
		},
	};

	let canonicalUrl = "";
	if (params.city) canonicalUrl += `/${params.city}`;
	if (params.developmentName) canonicalUrl += `/${params.developmentName}`;

	return {
		title: dbSeo.title || title,
		description: dbSeo.metaDescription || description,
		heading,
		keywords: dbSeo.keywords || keywords,
		jsonld,
		total,
		content: {
			Images: content?.Images || [],
			infoText:
				content?.infoText ||
				`Discover ${cityPart}${
					community ? ` – ${community}` : ""
				} real estate listings. Explore beautiful ${typeSegment}${bedBath}${featuresSegment} with Gulfshore Group.`,
			defaultImage: content?.defaultImage || "",
			golfCourses: (content as any)?.golfCourses || null,
			isGolfCommunity: (content as any)?.isGolfCommunity || false,
		},
		city,
		community,
		similar,
		canonicalUrl,
	};
}
