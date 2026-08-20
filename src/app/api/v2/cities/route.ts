import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/safeRedis";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;

		const limit = Number(queryParams.get("limit")) || 20;
		const type = queryParams.get("type")?.trim() || "";

		// ----- CACHE KEY -----
		const cacheKey = `cities:${type || "all"}:limit-${limit}`;

		// ----- CHECK REDIS CACHE (skip if cache-buster ?t= is present) -----
		const hasCacheBuster = !!queryParams.get("t");
		if (!hasCacheBuster) {
			const cached = await redisGet(cacheKey);
			if (typeof cached === "string") {
				return NextResponse.json(JSON.parse(cached));
			}
		}

		// Southwest Florida cities only
		const allowedNames = [
			"NAPLES", "Naples",
			"BONITA SPRINGS", "Bonita Springs",
			"ESTERO", "Estero",
			"AVE MARIA", "Ave Maria",
			"MARCO ISLAND", "Marco Island",
			"FORT MYERS", "Fort Myers",
			"FORT MYERS BEACH", "Fort Myers Beach",
			"CAPE CORAL", "Cape Coral",
			"SANIBEL", "Sanibel",
			"CAPTIVA", "Captiva",
			"LEHIGH ACRES", "Lehigh Acres",
			"BABCOCK RANCH", "Babcock Ranch",
			"IMMOKALEE", "Immokalee",
			"GOLDEN GATE", "Golden Gate",
			"GOODLAND", "Goodland",
			"EVERGLADES CITY", "Everglades City",
			"NORTH FORT MYERS", "North Fort Myers",
			"ALVA", "Alva",
			"MIROMAR LAKES", "Miromar Lakes",
			"PINE ISLAND", "Pine Island",
			"PINELAND", "Pineland",
		];

		let whereClause: any = {
			name: {
				in: allowedNames,
			},
		};

		if (type) {
			whereClause.isFeatured = true;
		}

		let data = await prisma.city.findMany({
			where: whereClause,
			include: {
				_count: { select: { communities: true } }, // show community count per city
			},
			orderBy: {
				name: "desc",
			},
			take: limit,
		});

		// Get active property count grouped by City
		const propertyCounts = await prisma.property.groupBy({
			by: ["City"],
			where: {
				StandardStatus: "Active",
				PropertyType: {
					not: "Residential Lease",
				},
				FullAddress: { not: "" },
				ListPrice: {
					not: null,
					gte: 1000,
				},
				NOT: [
					{ images: { equals: null } }
				],
			},
			_count: {
				_all: true,
			},
		});

		const countMap = new Map<string, number>();
		propertyCounts.forEach((group) => {
			const cityName = (group.City || "").trim().toLowerCase();
			if (cityName) {
				const count = (group._count as any)?._all || 0;
				countMap.set(cityName, (countMap.get(cityName) || 0) + count);
			}
		});

		// Attach actual active listing count to each city
		data = data.map((city: any) => {
			const cityNameKey = (city.name || "").trim().toLowerCase();
			const activePropertiesCount = countMap.get(cityNameKey) || 0;
			return {
				...city,
				_count: {
					...city._count,
					properties: activePropertiesCount,
				},
			};
		});

		// Filter out cities with zero active listings
		data = data.filter((city: any) => {
			const count = city._count?.properties ?? 0;
			return count > 0;
		});

		const response = { success: true, data };

		// ----- SAVE TO CACHE (2 hours for fresher listing counts) -----
		await redisSet(cacheKey, JSON.stringify(response), 7200);

		return NextResponse.json(response);
	} catch (error: any) {
		console.error("Error in GET /api/v2/cities:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", message: error.message, stack: error.stack },
			{ status: 500 }
		);
	}
}
