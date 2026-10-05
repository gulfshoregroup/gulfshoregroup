import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/safeRedis";
import prisma from "@/lib/prisma";

// High-speed in-memory cache for ultra-fast repeated loads (10 min TTL)
const propertyMemoryCache = new Map<string, { data: any; expiresAt: number }>();

function getFromMemory(key: string) {
	const item = propertyMemoryCache.get(key);
	if (item && item.expiresAt > Date.now()) {
		return item.data;
	}
	if (item) propertyMemoryCache.delete(key);
	return null;
}

function setInMemory(key: string, data: any, ttlSeconds = 600) {
	if (propertyMemoryCache.size > 2000) {
		const firstKey = propertyMemoryCache.keys().next().value;
		if (firstKey) propertyMemoryCache.delete(firstKey);
	}
	propertyMemoryCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ property: string }> }
) {
	try {
		const { property } = await params;
		const Mls = property;
		const cacheKey = `property:${Mls}`;

		// 1️⃣ FAST IN-MEMORY CACHE (< 1ms response)
		const memCached = getFromMemory(cacheKey);
		if (memCached) {
			return NextResponse.json({
				success: true,
				data: memCached,
				cached: true,
			});
		}

		// 2️⃣ CHECK REDIS CACHE
		const cached = await redisGet(cacheKey);
		if (cached) {
			const parsedData = typeof cached === "string" ? JSON.parse(cached) : cached;
			setInMemory(cacheKey, parsedData, 600);
			return NextResponse.json({
				success: true,
				data: parsedData,
				cached: true,
			});
		}

		const res = await prisma.property.findUnique({
			where: {
				ListingId: Mls,
			},
		});

		if (!res) {
			return NextResponse.json(
				{ error: "Property Not Found" },
				{ status: 404 }
			);
		}

		// Inject images from raw.Media if images field is null
		const rawData = res.raw as any;
		const resolvedImages =
			res.images ?? (rawData?.Media ? rawData.Media : null);

		// 🔥 Fetch similar properties using index directly (avoids full-table scan)
		const similarWhere: any = {
			StandardStatus: "Active",
			City: res.City,
			ListingId: { not: res.ListingId },
			NOT: { PropertyType: { contains: "Lease" } },
		};

		if (res.Community) {
			similarWhere.Community = res.Community;
		} else if (res.MLSAreaMajor) {
			similarWhere.MLSAreaMajor = res.MLSAreaMajor;
		}

		const similarRaw = await prisma.property.findMany({
			where: similarWhere,
			select: {
				id: true,
				ListingId: true,
				MLSNumber: true,
				FullAddress: true,
				City: true,
				StateOrProvince: true,
				ListPrice: true,
				BedroomsTotal: true,
				BathroomsFull: true,
				BathroomsHalf: true,
				LivingArea: true,
				PropertyType: true,
				PropertySubType: true,
				StandardStatus: true,
				Community: true,
				images: true,
			},
			take: 9,
		});

		// Format similar properties with image fallback
		const similar = similarRaw.map((s: any) => {
			return {
				...s,
				images: s.images || null,
			};
		});

		// Strip large Media from raw to save space, but keep the rest for frontend
		const rawSubset = res.raw as any;
		if (rawSubset) {
			delete rawSubset.Media;
			delete rawSubset.PublicRemarks;
		}

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { raw: _raw, ...resWithoutRaw } = res as any;

		const finalData = {
			...resWithoutRaw,
			raw: rawSubset,
			images: resolvedImages,
			similar,
		};

		// Cache in memory and Redis
		setInMemory(cacheKey, finalData, 600);
		await redisSet(cacheKey, finalData, 1800);

		return NextResponse.json({
			success: true,
			data: finalData,
			cached: false,
		});
	} catch (error) {
		console.log(error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

