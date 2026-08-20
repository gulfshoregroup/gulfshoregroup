import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ property: string }> }
) {
	try {
		const { property } = await params;
		const { userId } = await auth();

		const propertyAddress = decodeURIComponent(property)
			.trim()
			.replaceAll(/\s+/g, "-")
			.replace("-Fl-", "-FL-");

		// Try finding by ID / MLS Number / ListingKey
		let propertyRecord = await prisma.property.findFirst({
			where: {
				OR: [
					{ ListingId: property },
					{ ListingKey: property },
					{ MLSNumber: property },
				],
			},
		});

		// Fallback to address matching
		if (!propertyRecord) {
			const addressWithSpaces = propertyAddress.replaceAll("-", " ");
			propertyRecord = await prisma.property.findFirst({
				where: {
					FullAddress: {
						contains: addressWithSpaces,
					},
				},
			});
		}

		if (!propertyRecord) {
			return NextResponse.json(
				{ error: "Property Not Found" },
				{ status: 404 }
			);
		}

		let isWishlisted = false;
		if (userId) {
			const wishlistRecord = await prisma.wishlist.findFirst({
				where: {
					userId,
					propertyId: propertyRecord.id,
				},
			});
			isWishlisted = !!wishlistRecord;
		}

		const similarRaw = await prisma.property.findMany({
			where: {
				StandardStatus: "Active",
				City: propertyRecord.City,
				Community: propertyRecord.Community,
				id: {
					not: propertyRecord.id,
				},
			},
			take: 9,
		});

		const similar = similarRaw.map((s: any) => {
			const sRaw = s.raw as any;
			const sImages = s.images ?? (sRaw?.Media ? sRaw.Media : null);
			const { raw: _raw, ...rest } = s;
			return { ...rest, images: sImages };
		});

		const rawData = propertyRecord.raw as any;
		const resolvedImages = propertyRecord.images ?? (rawData?.Media ? rawData.Media : null);

		const mappedData = {
			...propertyRecord,
			_id: propertyRecord.id,
			PropertyAddress: propertyRecord.FullAddress,
			FullAddress: propertyRecord.FullAddress,
			LotType: propertyRecord.PropertyType,
			CurrentPrice: propertyRecord.ListPrice || 0,
			Latitude: propertyRecord.Latitude || 0,
			Longitude: propertyRecord.Longitude || 0,
			CreatedDate: propertyRecord.createdAt,
			images: resolvedImages,
			similar,
			wishlistInfo: isWishlisted ? [{ id: "wishlisted" }] : [],
		};

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error) {
		console.error("Error in legacy GET property detail:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
