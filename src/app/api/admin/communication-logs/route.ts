import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
	try {
		const logs = await prisma.communicationLog.findMany({
			orderBy: { createdAt: "desc" },
			take: 100, // Limit to 100 recent logs for performance
		});
		return NextResponse.json({ logs });
	} catch (error: any) {
		console.error("Error fetching communication logs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch logs" },
			{ status: 500 }
		);
	}
}
