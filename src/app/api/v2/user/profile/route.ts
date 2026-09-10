import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
	try {
		const { userId } = auth();
		if (!userId) {
			return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		// Find the lead associated with this clerk user ID
		const lead = await prisma.lead.findFirst({
			where: {
				clerkUserId: userId,
			},
		});

		if (lead) {
			return NextResponse.json({ success: true, profile: lead });
		}

		return NextResponse.json({ success: false, error: "Profile not found" }, { status: 404 });
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return NextResponse.json(
			{ success: false, error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
