import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(request: Request) {
	try {
		const user = await currentUser();
		if (!user) {
			return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
		}

		const email = user.emailAddresses[0]?.emailAddress;

		// Find the lead associated with this clerk user ID or email
		const lead = await prisma.lead.findFirst({
			where: {
				OR: [
					{ clerkUserId: user.id },
					...(email ? [{ email: email }] : [])
				]
			},
		});

		if (lead) {
			// If lead found by email but doesn't have clerkUserId, we can link them
			if (!lead.clerkUserId) {
				await prisma.lead.update({
					where: { id: lead.id },
					data: { clerkUserId: user.id }
				});
			}
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
