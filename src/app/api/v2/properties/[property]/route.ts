import { auth } from "@clerk/nextjs/server";

import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/safeRedis";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ property: string }> }
) {
	try {
		const { property } = await params;
		const { userId } = await auth();

		const Mls = property;
		/**
		 * 🌟 CACHE KEY (Different for logged-in and logged-out)
		 */
		const cacheKey = userId
			? `property:${Mls}:user:${userId}`
			: `property:${Mls}`;

		// 1️⃣ CHECK REDIS CACHE FIRST
		const cached = await redisGet(cacheKey);
		if (typeof cached === "string") {
			return NextResponse.json({
				success: true,
				data: JSON.parse(cached),
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

		// 🔥 Fetch similar properties
		const communityValue = res.Community || res.MLSAreaMajor || "";
		
		const similarRaw: any[] = await prisma.property.findMany({
			where: {
				StandardStatus: "Active",
				City: res.City,
				OR: [
					{ Community: communityValue },
					{ MLSAreaMajor: communityValue },
				],
				ListingId: {
					not: res.ListingId,
				},
				// Match property type logic
				...(res.PropertyType === "Land" || res.PropertyType?.includes("Lot") || res.PropertyType === "Lots & Land"
					? { PropertyType: "Land" }
					: res.PropertySubType === "Single Family Residence"
					? { PropertySubType: "Single Family Residence" }
					: res.PropertySubType?.includes("Rise") || res.PropertySubType === "Townhouse" || res.PropertyType?.includes("Condominium")
					? { PropertySubType: { in: ["Low Rise (1-3)", "Mid Rise (4-7)", "High Rise (8+)", "Townhouse"] } }
					: { PropertySubType: "Single Family Residence" }
				)
			},
			take: 9,
		});

		// Inject images into similar properties too
		const similar = similarRaw.map((s: any) => {
			const sRaw = s.raw as any;
			const sImages = s.images ?? (sRaw?.Media ? sRaw.Media : null);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { raw: _raw, ...rest } = s;
			return { ...rest, images: sImages };
		});

		// Strip Media and PublicRemarks from raw to save space, but keep the rest for frontend
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

		// Cache logged-out version for 5 minutes
		await redisSet(cacheKey, JSON.stringify(finalData), 1800);

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

