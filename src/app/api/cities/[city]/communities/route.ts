import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ city: string }> }
) {
	try {
		const { city } = await params;
		const cityName = city.trim();
		const res = await prisma.community.findMany({
			where: {
				city: {
					name: {
						contains: cityName,
					},
				},
			},
			select: {
				id: true,
				name: true,
			},
		});

		// Map to match mongoose shape
		const mappedData = res.map((c) => ({
			_id: c.id,
			name: c.name,
		}));

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error: any) {
		console.error("Error fetching communities for city:", error);
		return NextResponse.json(
			{ error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}
