import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const skip = (page - 1) * limit;

		const [logs, total] = await Promise.all([
			prisma.communicationLog.findMany({
				orderBy: { createdAt: "desc" },
				skip,
				take: limit,
			}),
			prisma.communicationLog.count(),
		]);

		const totalPages = Math.ceil(total / limit);

		return NextResponse.json({ 
			success: true,
			logs, 
			total,
			page,
			totalPages
		});
	} catch (error: any) {
		console.error("Error fetching communication logs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch logs" },
			{ status: 500 }
		);
	}
}
