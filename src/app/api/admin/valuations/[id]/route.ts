import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { status } = body;

		if (!status) {
			return NextResponse.json(
				{ success: false, error: "Status is required" },
				{ status: 400 }
			);
		}

		const updatedValuation = await prisma.contactRequest.update({
			where: { id },
			data: { status },
		});

		// Also update lead status if needed
		if (updatedValuation.email) {
			const cleanEmail = updatedValuation.email.toLowerCase().trim();
			const lead = await prisma.lead.findUnique({ where: { email: cleanEmail } });
			if (lead) {
				await prisma.lead.update({
					where: { id: lead.id },
					data: { status: status === "Closed" ? "Closed" : "Interested" },
				});
			}
		}

		return NextResponse.json({ success: true, valuation: updatedValuation });
	} catch (error: any) {
		console.error("Error updating valuation status:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	_: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		await prisma.contactRequest.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: "Valuation request deleted successfully",
		});
	} catch (error: any) {
		console.error("Error deleting valuation request:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
