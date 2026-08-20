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

		const updatedTour = await prisma.scheduleTour.update({
			where: { id },
			data: { status },
		});

		// Auto-sync Lead status & Hot Lead tag in Master CRM (/admin/leads)
		if (updatedTour.email && (status === "Confirmed" || status === "Completed")) {
			const cleanEmail = updatedTour.email.toLowerCase().trim();
			const existingLead = await prisma.lead.findUnique({
				where: { email: cleanEmail },
				select: { id: true, tags: true },
			});

			if (existingLead) {
				let currentTags: string[] = [];
				if (existingLead.tags) {
					try {
						currentTags = typeof existingLead.tags === "string"
							? JSON.parse(existingLead.tags)
							: (existingLead.tags as string[]);
					} catch (e) {
						console.error("Error parsing lead tags:", e);
					}
				}

				const newTags = Array.from(new Set([...currentTags, "Hot Lead", "Buyer"]));

				await prisma.lead.update({
					where: { id: existingLead.id },
					data: {
						status: "Interested",
						tags: newTags,
					},
				});
			}
		}

		return NextResponse.json({ success: true, tour: updatedTour });

	} catch (error: any) {
		console.error("Error updating tour status:", error);
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
		await prisma.scheduleTour.delete({
			where: { id },
		});

		return NextResponse.json({
			success: true,
			message: "Tour request deleted successfully",
		});
	} catch (error: any) {
		console.error("Error deleting tour request:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
