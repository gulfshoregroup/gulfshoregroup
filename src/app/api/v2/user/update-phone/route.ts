import { NextResponse } from "next/server";
import { verifyToken } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const authHeader = req.headers.get("Authorization");
		const token = authHeader?.split(" ")[1];

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let userId: string;
		try {
			const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
			userId = payload.sub;
		} catch (err) {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		const body = await req.json();
		const { phone, email } = body;

		if (!phone) {
			return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
		}

		// Update our database lead record
		const dbUser = await prisma.user.findUnique({
			where: { clerkId: userId },
		});

		if (dbUser) {
			await prisma.lead.updateMany({
				where: { email: dbUser.email },
				data: { phone },
			});
		} else if (email) {
            // fallback by email if we can't find them by clerkId directly
            await prisma.lead.updateMany({
                where: { email },
                data: { phone },
            });
        }

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Error updating phone:", error);
		return NextResponse.json(
			{ error: "Failed to update phone number", details: error.message },
			{ status: 500 }
		);
	}
}
