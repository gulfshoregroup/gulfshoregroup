import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ property: string }> }
) {
	try {
		const { property } = await params;
		let res = await prisma.property.findFirst({
			where: {
				OR: [
					{ ListingId: property },
					{ ListingKey: property },
					{ MLSNumber: property },
				],
			},
		});

		if (!res) {
			const addressWithSpaces = property.replaceAll("-", " ");
			res = await prisma.property.findFirst({
				where: {
					FullAddress: {
						contains: addressWithSpaces,
					},
				},
			});
		}

		if (!res) {
			return NextResponse.json(
				{ error: "Property Not Found" },
				{ status: 404 }
			);
		}

		const rawMedia = res.images || (res.raw as any)?.Media || [];
		const imagePaths = Array.isArray(rawMedia) ? rawMedia.map((img: any) => img.MediaURL || img) : [];
		const defaultPic = imagePaths.length > 0 ? imagePaths[0] : "";

		const mappedData = {
			_id: res.id,
			PropertyAddress: res.FullAddress,
			FullAddress: res.FullAddress,
			LotType: res.PropertyType,
			CurrentPrice: res.ListPrice || 0,
			MasterHOAFeeFreq: res.MasterHOAFeeFreq || "",
			MasterHOAFee: res.MasterHOAFee || 0,
			Latitude: res.Latitude || 0,
			Longitude: res.Longitude || 0,
			CreatedDate: res.createdAt,
			AllPixList: imagePaths,
			DefaultPic: defaultPic,
			PropertyClass: res.PropertySubType || "",
			Acres: res.LotSizeAcres ? String(res.LotSizeAcres) : "",
			ApproxLivingArea: res.LivingArea ? String(res.LivingArea) : "",
			BathsTotal: res.BathroomsFull ? String(res.BathroomsFull) : "0",
			BedsTotal: res.BedroomsTotal ? String(res.BedroomsTotal) : "0",
			Status: res.StandardStatus,
			PropertyType: res.PropertyType || "",
			YearBuilt: res.YearBuilt || 0,
			City: res.City,
			PostalCode: res.PostalCode || "",
			MLSNumber: res.MLSNumber,
			Development: res.Development || "",
			DevelopmentName: res.Community || "",
			ListOfficeName: res.ListOfficeName || "",
		};

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
