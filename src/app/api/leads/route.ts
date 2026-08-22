import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const skip = (page - 1) * limit;

		const [leads, total] = await Promise.all([
			prisma.lead.findMany({
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.lead.count(),
		]);

		// Parse tags JSON + provide lastContactedAt fallback
		const mapped = leads.map((lead) => ({
			...lead,
			tags: lead.tags
				? typeof lead.tags === "string"
					? JSON.parse(lead.tags)
					: lead.tags
				: [],
			// If never contacted, fall back to createdAt so UI never shows N/A
			lastContactedAt: lead.lastContactedAt ?? lead.createdAt,
		}));

		const totalPages = Math.ceil(total / limit);

		return NextResponse.json({ 
			success: true,
			data: mapped,
			total,
			page,
			totalPages 
		});
	} catch (error) {
		console.error("Error fetching leads:", error);
		return NextResponse.json(
			{ error: "Failed to fetch leads" },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		const data = await req.json();
		
		// Check duplicate email first to avoid Prisma crash
		const existing = await prisma.lead.findUnique({
			where: { email: data.email.toLowerCase().trim() },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "A lead with this email already exists." },
				{ status: 400 }
			);
		}

		const lead = await prisma.lead.create({
			data: {
				...data,
				email: data.email.toLowerCase().trim(),
			},
		});
		return NextResponse.json(lead, { status: 201 });
	} catch (error: any) {
		console.error("Error creating lead:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create lead" },
			{ status: 500 }
		);
	}
}
