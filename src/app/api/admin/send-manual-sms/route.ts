import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";

export async function POST(req: Request) {
	try {
		// Admin auth check can be added here if not handled by middleware
		
		const body = await req.json();
		const { leadId, message } = body;

		if (!leadId || !message) {
			return NextResponse.json({ error: "Lead ID and message are required" }, { status: 400 });
		}

		const lead = await prisma.lead.findUnique({
			where: { id: leadId }
		});

		if (!lead || !lead.phone) {
			return NextResponse.json({ error: "Lead not found or has no phone number" }, { status: 404 });
		}

		// 1. Send SMS via Twilio
		console.log(`[Admin Manual SMS] Sending to ${lead.phone}: "${message}"`);
		await sendSMS(lead.phone, message);

		// 2. Save to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "sms",
				role: "admin",
				message: message,
			}
		});

		// 3. Update lead's last contacted timestamp
		await prisma.lead.update({
			where: { id: lead.id },
			data: { lastContactedAt: new Date() }
		});

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Admin Send Manual SMS Error:", error);
		return NextResponse.json({ error: error.message || "Failed to send SMS" }, { status: 500 });
	}
}
