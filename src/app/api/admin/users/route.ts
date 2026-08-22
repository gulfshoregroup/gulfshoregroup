import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const skip = (page - 1) * limit;

		const [users, total] = await Promise.all([
			prisma.lead.findMany({
				where: {
					userId: {
						not: null,
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.lead.count({
				where: {
					userId: {
						not: null,
					},
				}
			}),
		]);

		// Map id to _id for admin frontend compatibility
		const mappedUsers = users.map((u) => ({
			...u,
			_id: u.id,
			clerkId: u.userId,
			name: u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
			profileImage: "", // Lead table doesn't store profile images, so default to empty
			isActive: true,
		}));

		const totalPages = Math.ceil(total / limit);

		return NextResponse.json({ 
			success: true, 
			users: mappedUsers,
			total,
			page,
			totalPages
		});
	} catch (error: any) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
