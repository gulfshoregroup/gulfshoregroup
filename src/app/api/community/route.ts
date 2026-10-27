import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

let communityPropertyCountCache: { map: Record<string, number>; ts: number } | null = null;
const COUNT_CACHE_TTL_MS = 60_000;

async function getCommunityPropertyCounts(): Promise<Record<string, number>> {
	if (communityPropertyCountCache && Date.now() - communityPropertyCountCache.ts < COUNT_CACHE_TTL_MS) {
		return communityPropertyCountCache.map;
	}
	const [communityCounts, developmentCounts] = await Promise.all([
		prisma.property.groupBy({
			by: ["Community"],
			_count: { id: true },
		}),
		prisma.property.groupBy({
			by: ["Development"],
			_count: { id: true },
		}),
	]);

	const countMap: Record<string, number> = {};

	for (const row of communityCounts) {
		const key = (row.Community || "").toLowerCase().trim();
		if (key) countMap[key] = (countMap[key] || 0) + row._count.id;
	}

	for (const row of developmentCounts) {
		const key = (row.Development || "").toLowerCase().trim();
		if (key) {
			countMap[key] = Math.max(countMap[key] || 0, row._count.id);
		}
	}

	communityPropertyCountCache = { map: countMap, ts: Date.now() };
	return countMap;
}

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;
		const limit = Number(queryParams.get("limit")) || 20;
		const page = Math.max(Number(queryParams.get("page")) || 1, 1);
		const search = queryParams.get("search") || "";

		const skip = (page - 1) * limit;

		const whereClause = search
			? {
					name: {
						contains: search,
					},
			  }
			: {};

		const [data, totalCount, countMap] = await Promise.all([
			prisma.community.findMany({
				where: whereClause,
				include: {
					city: true,
				},
				orderBy: {
					id: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.community.count({ where: whereClause }),
			getCommunityPropertyCounts(),
		]);

		// Map to Mongoose shape for compatibility
		const mappedData = data.map((c) => ({
			...c,
			_id: c.id,
			Development: c.name,
			City: c.city?.name || "",
			// Use live count from Property table, fallback to stored
			PropertyCount: countMap[c.name.toLowerCase().trim()] ?? c.propertyCount,
			Images: c.images || [],
		}));

		return NextResponse.json({
			success: true,
			data: mappedData,
			totalCount,
			page,
			totalPages: Math.ceil(totalCount / limit),
		});
	} catch (error: any) {
		console.error("Error fetching communities:", error);
		return NextResponse.json(
			{ success: false, message: "Internal Server Error", error: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		if (!body.Development || !body.City) {
			return NextResponse.json(
				{ error: "Community Name and City Name are required" },
				{ status: 400 }
			);
		}

		// Normalize names
		const communityName = body.Development.trim();
		const rawCity = body.City.trim();

		// Find city by name (case-insensitive) or auto-create
		let city = await prisma.city.findFirst({
			where: {
				name: rawCity,
			},
		});

		if (!city) {
			const citySlug = rawCity.toLowerCase().replace(/[^a-z0-9]+/g, "-");
			city = await prisma.city.create({
				data: {
					name: rawCity,
					slug: citySlug,
				},
			});
		}

		// Create a slug
		let slug = communityName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

		// Check if community slug exists and make unique if needed
		const existingComm = await prisma.community.findFirst({ where: { slug } });
		if (existingComm) {
			slug = `${slug}-${Date.now().toString().slice(-4)}`;
		}

		// Pack SEO and description fields into a JSON string
		const descriptionPayload = JSON.stringify({
			infoText: body.infoText || "",
			title: body.title || "",
			metaDescription: body.metaDescription || "",
			keywords: body.keywords || "",
		});

		// Prepare images array if defaultImage exists
		const images = body.defaultImage ? [body.defaultImage] : [];

		const newCommunity = await prisma.community.create({
			data: {
				name: communityName,
				slug: slug,
				description: descriptionPayload,
				defaultImage: body.defaultImage || null,
				images: images,
				cityId: city.id,
			},
		});

		const mappedData = {
			...newCommunity,
			_id: newCommunity.id,
			Development: newCommunity.name,
			City: city.name,
			PropertyCount: 0,
			Images: newCommunity.images || [],
		};

		return NextResponse.json(
			{
				success: true,
				message: "Community created successfully",
				data: mappedData,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error("Error creating community:", error);

		// Handle unique constraint error
		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: "A community with this name or slug already exists." },
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{ error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}
