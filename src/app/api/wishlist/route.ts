import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const limit = parseInt(searchParams.get("limit") || "100");
		
		const wishlists = await prisma.savedProperty.findMany({
			take: limit,
			orderBy: {
				createdAt: "desc"
			},
			include: {
				property: {
					select: {
						MLSNumber: true,
					}
				},
				lead: {
					select: {
						email: true,
						fullName: true,
					}
				}
			}
		});

		const mappedData = wishlists.map((w) => ({
			id: w.id,
			userId: w.lead?.email || w.lead?.fullName || w.leadId,
			mlsId: w.property?.MLSNumber || "N/A",
			createdAt: w.createdAt.toISOString()
		}));

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error: any) {
		console.error("Error fetching wishlists:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
