import prisma from "@/lib/prisma";

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> | any }
) {
	try {
		const { id } = await params;
		const notification = await prisma.scheduledNotification.findUnique({
			where: { id },
		});
		if (!notification) {
			return Response.json(
				{ error: "Notification not found" },
				{ status: 404 }
			);
		}

		// Map to Mongoose shape
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

		return Response.json(mappedNotification);
	} catch (error: any) {
		console.error("Error fetching notification:", error);
		return Response.json(
			{ error: "Failed to fetch notification", details: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> | any }
) {
	try {
		const { id } = await params;
		const body = await req.json();

		// Normalize fields if body contains Mongoose fields
		const prismaBody: any = {};
		if (body.type) prismaBody.notificationType = body.type;
		if (body.channel) prismaBody.channel = body.channel;
		if (body.segment) prismaBody.segment = body.segment;
		if (body.title) prismaBody.name = body.title;
		if (body.message) prismaBody.messageTemplate = body.message;
		if (body.scheduledFor) prismaBody.scheduledTime = new Date(body.scheduledFor);
		if (body.status) prismaBody.status = body.status;
		if (body.propertyCriteria) prismaBody.propertyCriteria = body.propertyCriteria;

		const notification = await prisma.scheduledNotification.update({
			where: { id },
			data: prismaBody,
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

		return Response.json(mappedNotification);
	} catch (error: any) {
		console.error("Error updating notification:", error);
		return Response.json(
			{ error: "Failed to update notification", details: error.message },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> | any }
) {
	try {
		const { id } = await params;

		const drip = await prisma.dripCampaign.findUnique({ where: { id } });
		if (drip) {
			await prisma.dripCampaign.delete({ where: { id } });
			return Response.json({ message: "Drip campaign deleted", _id: drip.id });
		}

		const notification = await prisma.scheduledNotification.delete({
			where: { id },
		});

		return Response.json({ message: "Notification deleted", _id: notification.id });
	} catch (error: any) {
		console.error("Error deleting notification:", error);
		return Response.json(
			{ error: "Failed to delete notification", details: error.message },
			{ status: 500 }
		);
	}
}
