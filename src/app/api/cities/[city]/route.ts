import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ city: string }> }
) {
	try {
		const { city } = await params;
		const cityName = decodeURIComponent(city)
			.trim()
			.toUpperCase()
			.replaceAll("-", " ");
		const res = await prisma.city.findFirst({
			where: {
				name: {
					equals: cityName,
				},
			},
			include: {
				communities: true,
			},
		});
		
		// Map back to Mongoose City representation for Frontend compatibility
		const mappedData = res ? {
			...res,
			_id: res.id,
			City: res.name,
			PropertyCount: res.communities.reduce((sum, com) => sum + com.propertyCount, 0),
			Images: res.images || [],
		} : null;

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error: any) {
		console.error("Error fetching city:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ city: string }> }
) {
	try {

		const { city } = await params;
		if (!city) {
			return NextResponse.json(
				{ error: "Missing city parameter" },
				{ status: 400 }
			);
		}

		// Decode and normalize the City name
		const cityName = decodeURIComponent(city)
			.trim()
			.toUpperCase()
			.replaceAll("-", " ");

		const body = await req.json();

		if (!body || Object.keys(body).length === 0) {
			return NextResponse.json(
				{ error: "Request body cannot be empty" },
				{ status: 400 }
			);
		}

		// Normalize fields if body contains Mongoose fields
		const prismaBody: any = {};
		if (body.City) prismaBody.name = body.City;
		if (body.slug) prismaBody.slug = body.slug;
		if (body.defaultImage) prismaBody.defaultImage = body.defaultImage;
		if (body.images) prismaBody.images = body.images;
		if (body.description) prismaBody.description = body.description;
		if (body.isFeatured !== undefined) prismaBody.isFeatured = body.isFeatured;

		// Find city first
		const existingCity = await prisma.city.findFirst({
			where: { name: cityName },
		});

		if (!existingCity) {
			return NextResponse.json(
				{ success: false, error: "City not found" },
				{ status: 404 }
			);
		}

		const updatedCity = await prisma.city.update({
			where: { id: existingCity.id },
			data: prismaBody,
		});

		const mappedData = {
			...updatedCity,
			_id: updatedCity.id,
			City: updatedCity.name,
		};

		return NextResponse.json({
			success: true,
			message: "City updated successfully",
			data: mappedData,
		});
	} catch (error: any) {
		console.error("Error updating city:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Internal server error",
				details: error?.message || "Unknown error",
			},
			{ status: 500 }
		);
	}
}
