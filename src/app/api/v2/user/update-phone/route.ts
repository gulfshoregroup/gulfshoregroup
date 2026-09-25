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
		let targetEmail = dbUser?.email || email;
		let hadPhoneAlready = false;

		if (targetEmail) {
			const existingLead = await prisma.lead.findFirst({ where: { email: targetEmail } });
			if (existingLead?.phone) {
				hadPhoneAlready = true;
			}
			await prisma.lead.updateMany({
				where: { email: targetEmail },
				data: { phone },
			});
		}

		// Update mock_user_phone cookie
		const { cookies } = require("next/headers");
		const cookieStore = await cookies();
		cookieStore.set("mock_user_phone", phone, { path: "/", maxAge: 31536000 });

		// Fire Welcome SMS ONLY IF they didn't have a phone before
		if (!hadPhoneAlready) {
			try {
				const { sendSMS } = require("@/lib/twilio");
				await sendSMS(
					phone,
					`Welcome to Gulfshore Group! Your VIP MLS account is active. Discover luxury Florida real estate today at https://gulfshoregroup.com`
				);
				console.log(`[MissingPhoneModal] Sent Welcome SMS to newly updated phone: ${phone}`);
			} catch (smsError) {
				console.error("[MissingPhoneModal] Failed to send welcome SMS:", smsError);
			}
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
