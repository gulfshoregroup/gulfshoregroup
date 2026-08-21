import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		// Twilio sends data as form-urlencoded
		const formData = await req.formData();
		const messageSid = formData.get("MessageSid")?.toString();
		const messageStatus = formData.get("MessageStatus")?.toString(); // e.g. sent, delivered, failed, undelivered

		if (!messageSid || !messageStatus) {
			return NextResponse.json({ error: "Missing required Twilio fields" }, { status: 400 });
		}

		// Update the CommunicationLog
		const log = await prisma.communicationLog.findUnique({
			where: { providerId: messageSid },
		});

		if (log) {
			const statusPriority: Record<string, number> = {
				"queued": 0,
				"sent": 1,
				"delivered": 2,
				"undelivered": 3,
				"failed": 3
			};

			const currentPriority = statusPriority[log.status] || 0;
			const newPriority = statusPriority[messageStatus] || 0;

			// Update if the new status is a progression
			if (newPriority > currentPriority || (newPriority === currentPriority && messageStatus !== log.status)) {
				await prisma.communicationLog.update({
					where: { id: log.id },
					data: { status: messageStatus },
				});
				console.log(`[Twilio Webhook] Updated log ${log.id} to status: ${messageStatus}`);
			}
		} else {
			console.log(`[Twilio Webhook] No CommunicationLog found for providerId (MessageSid): ${messageSid}`);
		}

		// Twilio expects an XML response or 200 OK
		return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
			status: 200,
			headers: { "Content-Type": "text/xml" }
		});
	} catch (error: any) {
		console.error("Twilio Events Webhook Error:", error);
		return NextResponse.json({ error: error.message || "Webhook failed" }, { status: 500 });
	}
}
