import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ community: string }> }
) {
	try {
		const { community } = await params;
		const communityName = decodeURIComponent(community)
			.trim()
			.toUpperCase();
		const res = await prisma.community.findFirst({
			where: {
				name: {
					equals: communityName,
				},
			},
			include: {
				city: true,
			},
		});

		// Map to Mongoose shape for compatibility
		const mappedData = res ? {
			...res,
			_id: res.id,
			Development: res.name,
			City: res.city?.name || "",
			PropertyCount: res.propertyCount,
			Images: res.images || [],
		} : null;

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error: any) {
		console.error("Error fetching community detail:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: NextRequest,
	{ params }: { params: Promise<{ community: string }> }
) {
	try {

		const { community } = await params;
		if (!community) {
			return NextResponse.json(
				{ error: "Missing community ID parameter" },
				{ status: 400 }
			);
		}

		// Decode and normalize the Development name
		const devName = decodeURIComponent(community)
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
		if (body.Development || body.name) prismaBody.name = body.Development || body.name;
		if (body.slug) prismaBody.slug = body.slug;
		if (body.defaultImage) prismaBody.defaultImage = body.defaultImage;
		if (body.images) prismaBody.images = body.images;
		if (body.description) prismaBody.description = body.description;
		if (body.propertyCount !== undefined) prismaBody.propertyCount = body.propertyCount;
		if (body.videoUrl !== undefined) prismaBody.videoUrl = body.videoUrl;
		if (body.isGolfCommunity !== undefined) prismaBody.isGolfCommunity = body.isGolfCommunity;
		if (body.golfCourses !== undefined) prismaBody.golfCourses = body.golfCourses;

		// Find community first
		const existingComm = await prisma.community.findFirst({
			where: { name: devName },
		});

		if (!existingComm) {
			return NextResponse.json(
				{ success: false, error: "Community not found" },
				{ status: 404 }
			);
		}

		const updatedCommunity = await prisma.community.update({
			where: { id: existingComm.id },
			data: prismaBody,
		});

		const mappedData = {
			...updatedCommunity,
			_id: updatedCommunity.id,
			Development: updatedCommunity.name,
		};

		return NextResponse.json({
			success: true,
			message: "Community updated successfully",
			data: mappedData,
		});
	} catch (error: any) {
		console.error("Error updating community:", error);
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
