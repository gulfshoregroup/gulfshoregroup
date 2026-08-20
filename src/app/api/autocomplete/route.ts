import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;
		const type = queryParams.get("type"); // community, subdivision, school
		const q = queryParams.get("q") || "";

		if (!q || q.length < 2) {
			return NextResponse.json({ success: true, data: [] });
		}

		let data: any[] = [];

		if (type === "community") {
			// Search from Community table
			const communities = await prisma.community.findMany({
				where: {
					name: {
						contains: q,
					},
				},
				select: {
					name: true,
				},
				take: 10,
				distinct: ["name"],
			});
			data = communities.map((c: any) => c.name);
		} else if (type === "subdivision") {
			// Search from Property table distinct subdivisions
			const properties = await prisma.property.findMany({
				where: {
					SubdivisionName: {
						contains: q,
					},
				},
				select: {
					SubdivisionName: true,
				},
				take: 10,
				distinct: ["SubdivisionName"],
			});
			data = properties.map((p: any) => p.SubdivisionName).filter(Boolean);
		} else if (type === "school") {
			// School data is not available in the Property model currently
			data = [];
		}

		return NextResponse.json({ success: true, data });
	} catch (error: any) {
		console.error("Autocomplete error:", error);
		return NextResponse.json({ success: false, data: [] });
	}
}
