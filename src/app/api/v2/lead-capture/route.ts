import prisma from "@/lib/prisma";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import {
	LEAD_ADMIN_ACTIONS,
	notifyAdminLeadAction,
} from "@/lib/leads/admin-notify";

export async function POST(req: NextRequest) {
	try {
		const evt = await verifyWebhook(req);
		const eventType = evt.type;

		if (eventType === "user.created") {
			const user = evt.data;
			const email =
				user.email_addresses?.find(
					(e) => e.id === user.primary_email_address_id
				)?.email_address ??
				user.email_addresses?.[0]?.email_address;

			if (!email) {
				console.error("[Clerk Webhook] user.created missing email");
				return new Response("Missing email", { status: 422 });
			}

			const clerkUserId = user.id;
			const lead = await prisma.lead.upsert({
				where: { userId: clerkUserId },
				update: {
					email,
					firstName: user.first_name ?? undefined,
					lastName: user.last_name ?? undefined,
					fullName:
						[user.first_name, user.last_name]
							.filter(Boolean)
							.join(" ") || undefined,
				},
				create: {
					userId: clerkUserId,
					fullName:
						[user.first_name, user.last_name]
							.filter(Boolean)
							.join(" ") || undefined,
					firstName: user.first_name ?? undefined,
					lastName: user.last_name ?? undefined,
					email,
					source: "Signup",
					status: "New",
				},
			});

			notifyAdminLeadAction({
				action: LEAD_ADMIN_ACTIONS.SIGNUP,
				lead,
			});
		}

		return new Response("OK", { status: 200 });
	} catch (err) {
		console.error("[Clerk Webhook]", err);
		return new Response("Error verifying webhook", { status: 400 });
	}
}
