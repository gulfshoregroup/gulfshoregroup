import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const criteria = await req.json();

	const lead = await prisma.lead.findUnique({ where: { id } });
	if (!lead)
		return NextResponse.json(
			{ message: "Lead not found" },
			{ status: 404 }
		);

	// Store propertyCriteria inside the tags JSON field
	const existingTags = (lead.tags as any) || {};
	const existingCriteria = existingTags?.propertyCriteria || [];
	const newCriteriaEntry = { ...criteria, _id: `crit_${Date.now()}` };
	const updatedCriteria = [...existingCriteria, newCriteriaEntry];

	const updated = await prisma.lead.update({
		where: { id },
		data: {
			tags: {
				...existingTags,
				propertyCriteria: updatedCriteria,
			},
		},
	});

	return NextResponse.json({
		...updated,
		_id: updated.id,
		propertyCriteria: updatedCriteria,
	});
}
