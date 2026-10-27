import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

let cityPropertyCountCache: { map: Record<string, number>; ts: number } | null = null;
const COUNT_CACHE_TTL_MS = 60_000;

async function getCityPropertyCounts(): Promise<Record<string, number>> {
	if (cityPropertyCountCache && Date.now() - cityPropertyCountCache.ts < COUNT_CACHE_TTL_MS) {
		return cityPropertyCountCache.map;
	}
	const propertyCounts = await prisma.property.groupBy({
		by: ["City"],
		_count: { id: true },
	});
	const countMap: Record<string, number> = {};
	for (const row of propertyCounts) {
		const key = (row.City || "").toLowerCase().trim();
		countMap[key] = (countMap[key] || 0) + row._count.id;
	}
	cityPropertyCountCache = { map: countMap, ts: Date.now() };
	return countMap;
}

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;
		const fetchAll = queryParams.get("all") === "true";
		const search = queryParams.get("search") || queryParams.get("q") || "";
		const page = parseInt(queryParams.get("page") || "1");
		const limit = parseInt(queryParams.get("limit") || "20");
		const skip = (page - 1) * limit;

		let whereClause: any = {};
		if (search && !fetchAll) {
			whereClause = {
				OR: [
					{ name: { contains: search } },
					{ slug: { contains: search } },
				],
			};
		}

		// Fetch cities, count, and cached property counts in parallel
		const [res, totalCount, countMap] = await Promise.all([
			prisma.city.findMany({
				where: whereClause,
				orderBy: fetchAll
					? [{ isFeatured: "desc" }, { name: "asc" }]
					: [{ isFeatured: "desc" }, { id: "desc" }],
				...(fetchAll ? {} : { skip, take: limit }),
			}),
			prisma.city.count({ where: whereClause }),
			getCityPropertyCounts(),
		]);

		const totalPages = Math.ceil(totalCount / limit);

		const mappedCities = res.map((c) => {
			const PropertyCount = countMap[c.name.toLowerCase().trim()] || 0;
			return {
				...c,
				_id: c.id,
				City: c.name,
				PropertyCount,
				Images: c.images || [],
			};
		});

		return NextResponse.json({
			success: true,
			data: mappedCities,
			totalCount,
			page,
			totalPages,
		});
	} catch (error: any) {
		console.error("Error fetching cities:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();

		if (!body.City) {
			return NextResponse.json(
				{ error: "City name is required" },
				{ status: 400 }
			);
		}

		// Normalize city name
		const cityName = body.City.trim().toUpperCase();

		// Create a slug
		const slug = body.City.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

		// Pack SEO and description fields into a JSON string
		const descriptionPayload = JSON.stringify({
			infoText: body.infoText || "",
			title: body.title || "",
			metaDescription: body.metaDescription || "",
			keywords: body.keywords || "",
		});

		// Prepare images array if defaultImage exists
		const images = body.defaultImage ? [body.defaultImage] : [];

		const newCity = await prisma.city.create({
			data: {
				name: cityName,
				slug: slug,
				description: descriptionPayload,
				isFeatured: body.isFeatured === true,
				defaultImage: body.defaultImage || null,
				images: images,
			},
		});

		const mappedData = {
			...newCity,
			_id: newCity.id,
			City: newCity.name,
			PropertyCount: 0,
			Images: newCity.images || [],
		};

		return NextResponse.json(
			{
				success: true,
				message: "City created successfully",
				data: mappedData,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error("Error creating city:", error);

		// Handle unique constraint error
		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: "A city with this name or slug already exists." },
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{ error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}
