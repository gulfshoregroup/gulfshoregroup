import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const notifications = await prisma.scheduledNotification.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		const drips = await prisma.dripCampaign.findMany({
			orderBy: { createdAt: "desc" },
		});

		// Map to Mongoose shape
		const mappedNotifications = [
			...notifications.map((n) => ({
				_id: n.id,
				type: n.notificationType,
				channel: n.channel,
				segment: n.segment,
				title: n.name,
				message: n.messageTemplate,
				scheduledFor: n.scheduledTime,
				status: n.status,
				propertyCriteria: n.propertyCriteria,
				createdAt: n.createdAt,
				updatedAt: n.updatedAt,
			})),
			...drips.map((d) => ({
				_id: d.id,
				type: "welcome",
				channel: d.channel,
				segment: "Users (Automated Drip)",
				title: d.name,
				message: d.messageTemplate,
				scheduledFor: null,
				dripLabel: d.daysAfterSignup === -1 
					? 'Automated: 10 Minutes After' 
					: d.daysAfterSignup === 0 
						? 'Automated: Immediately' 
						: `Automated: ${d.daysAfterSignup} Days After`,
				isDrip: true,
				status: d.status === "active" ? "Scheduled" : "Draft",
				propertyCriteria: {},
				createdAt: d.createdAt,
				updatedAt: d.createdAt,
			}))
		].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

		return Response.json(mappedNotifications);
	} catch (error: any) {
		console.error("Error fetching notifications:", error);
		return Response.json(
			{ error: "Failed to fetch notifications", details: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();

		const notification = await prisma.scheduledNotification.create({
			data: {
				notificationType: body.type || "Reminders",
				channel: body.channel || "Email",
				segment: body.segment || "users",
				name: body.title || "Untitled Notification",
				messageTemplate: body.message || "",
				scheduledTime: body.scheduledFor ? new Date(body.scheduledFor) : null,
				status: "Scheduled",
				propertyCriteria: body.propertyCriteria || {},
			},
		});

		const mappedNotification = {
			_id: notification.id,
			type: notification.notificationType,
			channel: notification.channel,
			segment: notification.segment,
			title: notification.name,
			message: notification.messageTemplate,
			scheduledFor: notification.scheduledTime,
			status: notification.status,
			propertyCriteria: notification.propertyCriteria,
			createdAt: notification.createdAt,
			updatedAt: notification.updatedAt,
		};

		return Response.json(mappedNotification, { status: 201 });
	} catch (error: any) {
		console.error("Error creating notification:", error);
		return Response.json(
			{ error: "Failed to create notification", details: error.message },
			{ status: 500 }
		);
	}
}
