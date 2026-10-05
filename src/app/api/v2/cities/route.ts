import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/safeRedis";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

const PRESEEDED_CITIES = [
	{ id: 1, name: "Naples", slug: "naples", defaultImage: null, images: null, isFeatured: true, _count: { communities: 371, properties: 4978 } },
	{ id: 8, name: "BONITA SPRINGS", slug: "bonita-springs", defaultImage: null, images: null, isFeatured: true, _count: { communities: 105, properties: 902 } },
	{ id: 12, name: "MARCO ISLAND", slug: "marco-island", defaultImage: null, images: null, isFeatured: true, _count: { communities: 11, properties: 483 } },
	{ id: 11, name: "ESTERO", slug: "estero", defaultImage: null, images: null, isFeatured: true, _count: { communities: 51, properties: 516 } },
	{ id: 3, name: "FORT MYERS", slug: "fort-myers", defaultImage: null, images: null, isFeatured: true, _count: { communities: 378, properties: 3157 } },
	{ id: 6, name: "CAPE CORAL", slug: "cape-coral", defaultImage: null, images: null, isFeatured: true, _count: { communities: 112, properties: 4703 } },
	{ id: 20, name: "AVE MARIA", slug: "ave-maria", defaultImage: null, images: null, isFeatured: true, _count: { communities: 2, properties: 222 } },
	{ id: 16, name: "SANIBEL", slug: "sanibel", defaultImage: null, images: null, isFeatured: true, _count: { communities: 52, properties: 278 } },
	{ id: 21, name: "CAPTIVA", slug: "captiva", defaultImage: null, images: null, isFeatured: true, _count: { communities: 15, properties: 83 } },
	{ id: 22, name: "FORT MYERS BEACH", slug: "fort-myers-beach", defaultImage: null, images: null, isFeatured: true, _count: { communities: 85, properties: 632 } },
	{ id: 19, name: "MIROMAR LAKES", slug: "miromar-lakes", defaultImage: null, images: null, isFeatured: true, _count: { communities: 1, properties: 40 } },
	{ id: 9, name: "Babcock Ranch", slug: "babcock-ranch", defaultImage: null, images: null, isFeatured: true, _count: { communities: 0, properties: 36 } },
	{ id: 5, name: "LEHIGH ACRES", slug: "lehigh-acres", defaultImage: null, images: null, isFeatured: true, _count: { communities: 50, properties: 4521 } },
	{ id: 36, name: "IMMOKALEE", slug: "immokalee", defaultImage: null, images: null, isFeatured: true, _count: { communities: 5, properties: 27 } },
];

// High-speed in-memory cache for cities (persisted across Next.js dev server re-evaluations)
const globalForCities = globalThis as unknown as {
	memoryCachedCities?: { [key: string]: { data: any; expiresAt: number } };
};
let memoryCachedCities: { [key: string]: { data: any; expiresAt: number } } = globalForCities.memoryCachedCities || {
	"cities:featured:limit-200": {
		data: { success: true, data: PRESEEDED_CITIES },
		expiresAt: Date.now() + 86400 * 1000,
	},
	"cities:featured:limit-all": {
		data: { success: true, data: PRESEEDED_CITIES },
		expiresAt: Date.now() + 86400 * 1000,
	},
};
if (process.env.NODE_ENV !== "production") {
	globalForCities.memoryCachedCities = memoryCachedCities;
}

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;

		const limitParam = queryParams.get("limit");
		const limit = limitParam === "all" ? undefined : (Number(limitParam) || 200);
		const type = queryParams.get("type")?.trim() || "";

		// ----- CACHE KEY -----
		const cacheKey = `cities:${type || "all"}:limit-${limit || "all"}`;

		// 1️⃣ FAST IN-MEMORY CACHE (< 1ms response)
		const memItem = memoryCachedCities[cacheKey];
		const isFlush = queryParams.get("flush") === "true";
		if (!isFlush && memItem && memItem.expiresAt > Date.now()) {
			return NextResponse.json(memItem.data);
		}

		// 2️⃣ CHECK REDIS CACHE
		if (!isFlush) {
			const cached = await redisGet(cacheKey);
			if (cached) {
				const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
				memoryCachedCities[cacheKey] = { data: parsed, expiresAt: Date.now() + 3600 * 1000 };
				return NextResponse.json(parsed);
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

		// ----- SAVE TO CACHE (1 hour memory, 2 hours Redis) -----
		memoryCachedCities[cacheKey] = { data: response, expiresAt: Date.now() + 3600 * 1000 };
		await redisSet(cacheKey, response, 7200);

		return NextResponse.json(response);
	} catch (error: any) {
		console.error("Error in GET /api/v2/cities:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", message: error.message, stack: error.stack },
			{ status: 500 }
		);
	}
}
