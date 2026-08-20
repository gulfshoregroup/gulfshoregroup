import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			firstName,
			lastName,
			email,
			phone,
			message,
			propertyAddress,
			MLSNumber,
			date,
			propertyId,
		} = body;

		if (!email || !phone)
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);

		const resolvedName = `${firstName || ""} ${lastName || ""}`.trim() || "Unknown User";
		const resolvedFirstName = firstName || "";
		const resolvedLastName = lastName || "";

		// 1. Create or update Lead in SQL
		const sqlLead = await prisma.lead.upsert({
			where: { email },
			update: {
				firstName: resolvedFirstName || undefined,
				lastName: resolvedLastName || undefined,
				fullName: resolvedName,
				phone: phone || undefined,
			},
			create: {
				firstName: resolvedFirstName,
				lastName: resolvedLastName,
				fullName: resolvedName,
				email,
				phone: phone || undefined,
				status: "New",
				source: "Tour_Request",
			},
		});


		const targetPropertyId = propertyId || MLSNumber || "";
		const formattedMessage = message || (propertyAddress ? `Scheduled a tour for property ${propertyAddress}` : "");

		// 2. Create Inquiry in SQL linked to the Lead
		await prisma.inquiry.create({
			data: {
				leadId: sqlLead.id,
				type: "Tour_Request",
				message: formattedMessage,
				propertyId: targetPropertyId || undefined,
			},
		});

		let parsedDate = new Date();
		if (date) {
			const d = new Date(date);
			if (!isNaN(d.getTime())) {
				parsedDate = d;
			}
		}

		// 3. Create ScheduleTour in SQL
		const sqlTour = await prisma.scheduleTour.create({
			data: {
				email,
				name: resolvedName,
				date: parsedDate,
				phone,
				message: formattedMessage,
				status: "Pending",
				propertyId: targetPropertyId,
			},
		});


		return NextResponse.json({ success: true, lead: sqlLead, tour: sqlTour });
	} catch (err: any) {
		console.error(err);
		return NextResponse.json(
			{ success: false, error: err.message },
			{ status: 500 }
		);
	}
}
