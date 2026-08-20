import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/safeRedis";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ city: string }> }
) {
	try {
		const { city } = await params;
		const cityName = city.trim().toLowerCase();

		// Create a unique cache key
		const cacheKey = `communities:${cityName}`;

		// 1. Check Cache
		const cached = await redisGet(cacheKey);
		if (typeof cached === "string") {
			return NextResponse.json({
				success: true,
				data: JSON.parse(cached),
				cached: true,
			});
		}

		let res = await prisma.community.findMany({
			where: {
				city: {
					OR: [
						{ slug: { equals: cityName } },
						{ name: { equals: cityName.replaceAll("-", " ") } },
						{ name: { equals: city.replaceAll("-", " ") } },
					],
				},
			},
			select: {
				name: true,
			},
		});

		if (!res || res.length === 0) {
			const formattedCity = city.replaceAll("-", " ");
			const propCommunities = await prisma.property.findMany({
				where: {
					City: {
						equals: formattedCity,
					},
					Community: {
						not: null,
					},
				},
				select: {
					Community: true,
				},
				distinct: ["Community"],
				take: 150,
			});

			res = propCommunities
				.filter(p => p.Community && p.Community.trim().length > 0)
				.map(p => ({ name: p.Community!.trim() }));
		}

		// 3. Save to Redis (1 day)
		await redisSet(cacheKey, JSON.stringify(res), 86400);

		return NextResponse.json({
			success: true,
			data: res,
			cached: false,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
