import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const criteria = await req.json();

		const lead = await prisma.lead.findUnique({ where: { id } });
		if (!lead)
			return NextResponse.json(
				{ message: "Lead not found" },
				{ status: 404 }
			);

		// Store as a SavedSearch record linked to this lead
		const saved = await prisma.savedSearch.create({
			data: {
				userId: lead.id,
				name: `${criteria.city || "Naples"} Search Criteria`,
				filters: criteria,
			},
		});

		return NextResponse.json({
			success: true,
			data: saved,
		});
	} catch (err: any) {
		console.error("Error saving lead criteria:", err);
		return NextResponse.json(
			{ error: err.message || "Failed to save criteria" },
			{ status: 500 }
		);
	}
}
