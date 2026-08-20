import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

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
		} = body;
 
		if (!email || typeof email !== "string" || !email.includes("@")) {
			return NextResponse.json(
				{ success: false, error: "Valid email address is required" },
				{ status: 400 }
			);
		}

		const lead = await prisma.lead.upsert({
			where: { email },
			update: {
				firstName: firstName || undefined,
				lastName: lastName || undefined,
				phone: phone || undefined,
			},
			create: {
				firstName: firstName || "",
				lastName: lastName || "",
				email,
				phone: phone || null,
				source: "Contact_Form",
				status: "New",
			},
		});

		// Find property record by MLSNumber if available
		let propertyId: string | null = null;
		if (MLSNumber) {
			const prop = await prisma.property.findUnique({
				where: { ListingId: MLSNumber },
				select: { id: true },
			});
			if (prop) propertyId = prop.id;
		}

		await prisma.inquiry.create({
			data: {
				leadId: lead.id,
				type: "Contact_Form",
				message: message || `Contact request for property ${propertyAddress || ""}`,
				propertyId: propertyId || undefined,
			},
		});

		const mappedLead = {
			...lead,
			_id: lead.id,
		};

		return NextResponse.json({ success: true, lead: mappedLead });
	} catch (err: any) {
		return NextResponse.json(
			{ success: false, error: err.message },
			{ status: 500 }
		);
	}
}
