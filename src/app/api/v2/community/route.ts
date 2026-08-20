import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
	try {
		const queryParams = req.nextUrl.searchParams;

		const limit = Number(queryParams.get("limit")) || 20;

		const res = await prisma.community.findMany({
			take: limit,
			orderBy: {
				name: "asc",
			},
		});

		const mappedData = res.map((c) => ({
			...c,
			_id: c.id,
			Community: c.name,
		}));

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
