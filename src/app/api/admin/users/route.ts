import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const users = await prisma.lead.findMany({
			where: {
				userId: {
					not: null,
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Map id to _id for admin frontend compatibility
		const mappedUsers = users.map((u) => ({
			...u,
			_id: u.id,
			clerkId: u.userId,
			name: u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown User",
			profileImage: "", // Lead table doesn't store profile images, so default to empty
			isActive: true,
		}));

		return NextResponse.json({ success: true, users: mappedUsers });
	} catch (error: any) {
		console.error("Error fetching users:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
