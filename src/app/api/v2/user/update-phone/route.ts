import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	try {
		const cookieStore = await cookies();
		const userId = cookieStore.get("mock_user_id")?.value;
		const mockEmail = cookieStore.get("mock_user_email")?.value;

		if (!userId && !mockEmail) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { phone, email } = body;

		if (!phone) {
			return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
		}

		// Update our database lead record
		let dbUser = null;
		if (userId) {
			dbUser = await prisma.user.findUnique({
				where: { clerkId: userId },
			});
		} else if (mockEmail) {
			dbUser = await prisma.user.findFirst({
				where: { email: mockEmail },
			});
		}
		let targetEmail = dbUser?.email || email || mockEmail;
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
