import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const { propertyId, propertyAddress, inquiryType, message } =
			await req.json();

		if (!propertyId || !propertyAddress || !inquiryType)
			return NextResponse.json(
				{ error: "Missing fields" },
				{ status: 400 }
			);

		const lead = await prisma.lead.findUnique({
			where: { id },
		});
		if (!lead)
			return NextResponse.json(
				{ error: "Lead not found" },
				{ status: 404 }
			);

		// Create Inquiry linked to lead
		await prisma.inquiry.create({
			data: {
				leadId: lead.id,
				type: inquiryType === "Contact" ? "Contact_Form" : inquiryType === "Tour" ? "Tour_Request" : "General",
				message: message || `Inquiry for ${propertyAddress}`,
				propertyId: propertyId,
			},
		});

		const mappedLead = {
			...lead,
			_id: lead.id,
		};

		return NextResponse.json(mappedLead);
	} catch (error) {
		console.error("Error adding inquiry:", error);
		return NextResponse.json(
			{ error: "Failed to add inquiry" },
			{ status: 500 }
		);
	}
}
