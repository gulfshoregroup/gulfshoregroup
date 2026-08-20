import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { name, channel, daysAfterSignup, messageTemplate } = body;

		if (!name || !channel || typeof daysAfterSignup !== "number" || !messageTemplate) {
			return NextResponse.json(
				{ success: false, message: "Missing required fields" },
				{ status: 400 }
			);
		}

		const campaign = await prisma.dripCampaign.create({
			data: {
				name,
				channel,
				daysAfterSignup,
				messageTemplate,
				status: "active",
			},
		});

		return NextResponse.json({ success: true, campaign }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating drip campaign:", error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const campaigns = await prisma.dripCampaign.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json({ success: true, data: campaigns }, { status: 200 });
	} catch (error: any) {
		console.error("Error fetching drip campaigns:", error);
		return NextResponse.json(
			{ success: false, message: error.message },
			{ status: 500 }
		);
	}
}
