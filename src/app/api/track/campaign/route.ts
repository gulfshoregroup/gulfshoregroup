import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { source, path } = body;

		if (!source) {
			return NextResponse.json(
				{ success: false, error: "Source is required" },
				{ status: 400 }
			);
		}

		// Log the campaign click in database
		const click = await prisma.campaignClick.create({
			data: {
				source: String(source),
				path: path ? String(path) : null,
			},
		});

		return NextResponse.json({ success: true, click });
	} catch (error: any) {
		console.error("UTM tracking failed:", error.message || error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
