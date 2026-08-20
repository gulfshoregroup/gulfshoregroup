import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
	try {
		const { id, status } = await req.json();

		if (!id || !status)
			return NextResponse.json(
				{ error: "ID and status required" },
				{ status: 400 }
			);

		const lead = await prisma.lead.findUnique({ where: { id } });
		if (!lead)
			return NextResponse.json(
				{ error: "Lead not found" },
				{ status: 404 }
			);

		const updated = await prisma.lead.update({
			where: { id },
			data: {
				status,
				lastContactedAt: new Date(),
			},
		});

		return NextResponse.json({ ...updated, _id: updated.id });
	} catch (error) {
		console.error("Error updating status:", error);
		return NextResponse.json(
			{ error: "Failed to update lead status" },
			{ status: 500 }
		);
	}
}
