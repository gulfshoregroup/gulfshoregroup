import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const skip = (page - 1) * limit;
		
		const [wishlists, totalCount] = await Promise.all([
			prisma.savedProperty.findMany({
				skip,
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
			}),
			prisma.savedProperty.count()
		]);

		const mappedData = wishlists.map((w) => ({
			id: w.id,
			userId: w.lead?.email || w.lead?.fullName || w.leadId,
			mlsId: w.property?.MLSNumber || "N/A",
			createdAt: w.createdAt.toISOString()
		}));

		const totalPages = Math.ceil(totalCount / limit);

		return NextResponse.json({ 
			success: true, 
			data: mappedData,
			total: totalCount,
			page,
			totalPages
		});
	} catch (error: any) {
		console.error("Error fetching wishlists:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
