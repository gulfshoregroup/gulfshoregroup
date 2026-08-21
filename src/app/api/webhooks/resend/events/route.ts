import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		console.log("[Resend Outbound Event Webhook Payload Received]:", JSON.stringify(body));

		const type = body.type; // e.g., 'email.delivered', 'email.opened', 'email.bounced'
		const data = body.data;

		if (!data || !data.email_id) {
			return NextResponse.json({ error: "Missing email_id in payload" }, { status: 400 });
		}

		const emailId = data.email_id;
		
		// Map Resend events to our status
		let newStatus = "sent";
		if (type === "email.delivered") newStatus = "delivered";
		else if (type === "email.opened") newStatus = "opened";
		else if (type === "email.bounced") newStatus = "bounced";
		else if (type === "email.clicked") newStatus = "clicked";
		else if (type === "email.complained") newStatus = "failed";

		// Update the CommunicationLog
		const log = await prisma.communicationLog.findUnique({
			where: { providerId: emailId },
		});

		if (log) {
			// Only update if the new status is "further along" than the current status
			// (e.g. don't downgrade 'opened' back to 'delivered' if events arrive out of order)
			const statusPriority: Record<string, number> = {
				"sent": 1,
				"delivered": 2,
				"opened": 3,
				"clicked": 4,
				"bounced": 5,
				"failed": 5
			};

			const currentPriority = statusPriority[log.status] || 0;
			const newPriority = statusPriority[newStatus] || 0;

			if (newPriority > currentPriority) {
				await prisma.communicationLog.update({
					where: { id: log.id },
					data: { status: newStatus },
				});
				console.log(`[Resend Webhook] Updated log ${log.id} to status: ${newStatus}`);
			} else {
				console.log(`[Resend Webhook] Ignored status update ${newStatus} for log ${log.id} (current: ${log.status})`);
			}
		} else {
			console.log(`[Resend Webhook] No CommunicationLog found for providerId: ${emailId}`);
		}

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Resend Events Webhook Error:", error);
		return NextResponse.json({ error: error.message || "Webhook failed" }, { status: 500 });
	}
}
