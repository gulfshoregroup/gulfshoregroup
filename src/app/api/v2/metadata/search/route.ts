import capitalizeWords from "@/hooks/capitalize-letter";
import { formatPrice } from "@/hooks/formatPrice";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
interface SearchParams {
	city: string;
	developmentName: string;
	beds: string;
	baths: string;
	minPrice: string;
	maxPrice: string;
	builtYearMin: string;
	builtYearMax: string;
	sort: string;
	order: string;
	propertyTypes: string[];
	postalCode: string;
	page: string;
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);

		const params: SearchParams = {
			city: searchParams.get("city") || "",
			developmentName: searchParams.get("developmentName") || "",
			beds: searchParams.get("beds") || "",
			baths: searchParams.get("baths") || "",
			minPrice: searchParams.get("minPrice") || "",
			maxPrice: searchParams.get("maxPrice") || "",
			builtYearMin: searchParams.get("builtYearMin") || "",
			builtYearMax: searchParams.get("builtYearMax") || "",
			sort: searchParams.get("sort") || "",
			order: searchParams.get("order") || "",
			propertyTypes: searchParams.getAll("propertyTypes"),
			postalCode: searchParams.get("postalCode") || "",
			page: searchParams.get("page") || "1",
		};
		let city = "";
		let community = "";
		if (params.city) {
			const c = params.city || "";
			city =
				capitalizeWords(c.replaceAll(/[^a-zA-Z0-9&]+/g, " ")) || "";
		}
		if (params.developmentName) {
			community =
				capitalizeWords(
					params.developmentName.replaceAll(/[^a-zA-Z0-9&]+/g, " ")
				) || "";
		}
		let total: number = 0;
		let where: any = { StandardStatus: "Active" };
		let content: any = {};

		const cityPart = params.city
			? ` ${city}, FL Real Estate`
			: " Florida Real Estate";

		const devPart = params.developmentName ? ` ${community},` : "";

		if (params.city) {
			const cityName = decodeURIComponent(params.city).trim();
			where.City = {
				equals: cityName,
			};

			const cityRecord = await prisma.city.findFirst({
				where: {
					name: {
						equals: cityName,
					},
				},
			});

			if (cityRecord) {
				content = {
					Images: cityRecord.images || [],
					infoText: cityRecord.description || "",
					defaultImage: cityRecord.defaultImage || "",
				};
			}
		}
		if (params.developmentName) {
			const devName = decodeURIComponent(params.developmentName).trim();
			where.OR = [
				{ Development: { equals: devName } },
				{ Community: { equals: devName } }
			];

			const communityRecord = await prisma.community.findFirst({
				where: {
					name: {
						equals: devName,
					},
				},
			});

			if (communityRecord && communityRecord.description) {
				content = {
					Images: communityRecord.images || [],
					infoText: communityRecord.description || "",
					defaultImage: communityRecord.defaultImage || "",
				};
			}
		}

		total = await prisma.property.count({ where });

		const bedBathPart =
			params.beds || params.baths
				? ` with ${params.beds ? params.beds + " Beds" : ""}${
						params.beds && params.baths ? " & " : ""
				  }${params.baths ? params.baths + " Baths" : ""} `
				: "";

		const minPart =
			params.minPrice &&
			params.maxPrice &&
			`Starting From ${formatPrice(parseInt(params.minPrice))} `;
		const maxPart =
			!params.minPrice &&
			params.maxPrice &&
			`Under ${formatPrice(parseInt(params.maxPrice))} `;
		const typePart =
			params.propertyTypes.length > 0 &&
			params.propertyTypes[0].trim()
				? `${params.propertyTypes.join(", ")} For Sale in`
				: "";

		// Title
		const title = `${typePart}${devPart}${cityPart} ${
			!city && !devPart ? "Listings." : ""
		} ${minPart || maxPart || ""}${bedBathPart}- Gulfshore Group`
			.replaceAll("  ", " ")
			.trim();

		// Description
		const description = `Browse ${
			city || "Florida"
		} real estate listings ${typePart}${devPart}${cityPart}${bedBathPart}. Total ${total} Listings in${devPart}${cityPart}.${
			!cityPart && !devPart
				? "Discover homes, condos, and real estate properties available now."
				: ""
		}`
			.replaceAll("  ", " ")
			.trim();

		const heading = `${
			typePart || "Listings in"
		}${devPart}${cityPart}`
			.replaceAll("  ", " ")
			.trim();
		return NextResponse.json({
			title,
			city,
			community,
			description,
			heading,
			content,
			keywords: [
				params.city,
				params.developmentName,
				...params.propertyTypes,
				params.beds ? `${params.beds} bedroom homes` : "",
				params.baths ? `${params.baths} bathroom homes` : "",
				"Florida real estate",
				"homes for sale",
				"condos for sale",
				"Gulfshore Group",
				"Gulfshore Group Florida Real Estate",
			].filter(Boolean),
		});
	} catch (error) {
		return NextResponse.json({}, { status: 500 });
	}
}
