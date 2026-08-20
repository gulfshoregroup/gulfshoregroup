import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {

		// Get total counts for each table in parallel using Prisma
		const [
			totalCities,
			totalCommunities,
			totalContacts,
			totalProperties,
			totalTours,
			totalUsers,
		] = await Promise.all([
			prisma.city.count(),
			prisma.community.count(),
			prisma.contactRequest.count(),
			prisma.property.count(),
			prisma.scheduleTour.count(),
			prisma.lead.count({
				where: {
					userId: {
						not: null,
					},
				},
			}),
		]);

		const res = {
			totalCities,
			totalCommunities,
			totalContacts,
			totalProperties,
			totalTours,
			totalUsers,
		};

		return NextResponse.json({ success: true, data: res });
	} catch (error) {
		console.error("Error fetching totals:", error);
		return NextResponse.json(
			{ success: false, error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
