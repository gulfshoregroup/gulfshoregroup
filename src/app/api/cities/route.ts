import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;
		const limit = Number(queryParams.get("limit")) || 400;

		// Fetch cities
		const res = await prisma.city.findMany({
			orderBy: { id: "desc" },
			take: limit,
		});
		const totalCount = await prisma.city.count();

		// Count properties per city from the Property table (City is a plain string)
		const propertyCounts = await prisma.property.groupBy({
			by: ["City"],
			_count: { id: true },
		});

		// Build a lookup map: lowercase city name → count
		const countMap: Record<string, number> = {};
		for (const row of propertyCounts) {
			const key = (row.City || "").toLowerCase().trim();
			countMap[key] = (countMap[key] || 0) + row._count.id;
		}

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
			keywords: body.keywords || ""
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
				images: images
			}
		});

		const mappedData = {
			...newCity,
			_id: newCity.id,
			City: newCity.name,
			PropertyCount: 0,
			Images: newCity.images || []
		};

		return NextResponse.json({
			success: true,
			message: "City created successfully",
			data: mappedData
		}, { status: 201 });

	} catch (error: any) {
		console.error("Error creating city:", error);
		
		// Handle unique constraint error
		if (error.code === 'P2002') {
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
