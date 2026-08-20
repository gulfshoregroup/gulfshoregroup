import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getMappedLead(id: string) {
	const lead = await prisma.lead.findUnique({
		where: { id },
		include: {
			notes: {
				orderBy: {
					createdAt: "desc",
				},
			},
			inquiryHistory: {
				orderBy: {
					createdAt: "desc",
				},
			},
		},
	});

	if (!lead) return null;

	return {
		...lead,
		_id: lead.id,
		fullName: lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown User",
		tags: lead.tags ? (typeof lead.tags === "string" ? JSON.parse(lead.tags) : lead.tags) : [],
		notes: lead.notes.map((n) => ({
			_id: n.id,
			content: n.message,
			createdAt: n.createdAt,
		})),
		inquiryHistory: lead.inquiryHistory.map((i) => ({
			_id: i.id,
			type: i.type,
			message: i.message,
			propertyId: i.propertyId,
			createdAt: i.createdAt,
		})),
	};
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const { content } = await req.json();

		if (!content) {
			return NextResponse.json(
				{ error: "Note content required" },
				{ status: 400 }
			);
		}

		const leadExists = await prisma.lead.findUnique({ where: { id } });
		if (!leadExists) {
			return NextResponse.json(
				{ error: "Lead not found" },
				{ status: 404 }
			);
		}

		await prisma.note.create({
			data: {
				leadId: id,
				message: content,
			},
		});

		const lead = await getMappedLead(id);
		return NextResponse.json(lead);
	} catch (error: any) {
		console.error("Error adding note:", error);
		return NextResponse.json(
			{ error: "Failed to add note", details: error.message },
			{ status: 500 }
		);
	}
}
