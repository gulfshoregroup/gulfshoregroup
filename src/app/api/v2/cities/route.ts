import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/safeRedis";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;

		const limitParam = queryParams.get("limit");
		const limit = limitParam === "all" ? undefined : (Number(limitParam) || 200);
		const type = queryParams.get("type")?.trim() || "";

		// ----- CACHE KEY -----
		const cacheKey = `cities:${type || "all"}:limit-${limit || "all"}`;

		// ----- CHECK REDIS CACHE (skip if cache-buster ?t= is present) -----
		const hasCacheBuster = !!queryParams.get("t");
		if (!hasCacheBuster) {
			const cached = await redisGet(cacheKey);
			if (typeof cached === "string") {
				return NextResponse.json(JSON.parse(cached));
			}
		}

		let whereClause: any = {};

		if (type === "featured") {
			whereClause.isFeatured = true;
		}

		let data = await prisma.city.findMany({
			where: whereClause,
			include: {
				_count: { select: { communities: true } }, // show community count per city
			},
			orderBy: [
				{ isFeatured: "desc" },
				{ name: "asc" },
			],
			...(limit ? { take: limit } : {}),
		});

		// Get active property count grouped by City
		const propertyCounts = await prisma.property.groupBy({
			by: ["City"],
			where: {
				StandardStatus: "Active",
				NOT: [
					{ PropertyType: { contains: "Lease" } },
					{ images: { equals: Prisma.DbNull } }
				],
				FullAddress: { not: "" },
				ListPrice: {
					not: null,
					gte: 1000,
				},
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
