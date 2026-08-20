import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
	try {
		const query = req.nextUrl.searchParams;
		const limit = Math.min(50, Number(query.get("limit") || 10));
		const mlsVal = query.get("mls");

		const where: any = {};
		if (mlsVal) {
			where.MLSNumber = mlsVal;
		}

		const properties = await prisma.property.findMany({
			where,
			take: limit,
			// Not specifying 'select' means Prisma will return ALL fields, including 'raw'
		});

		return NextResponse.json({
			success: true,
			count: properties.length,
			data: properties
		});
	} catch (error: any) {
		return NextResponse.json({ success: false, error: error.message }, { status: 500 });
	}
}
