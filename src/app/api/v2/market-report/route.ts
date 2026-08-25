import { NextRequest, NextResponse } from "next/server";
import { getMarketReportData } from "@/lib/services/market-report.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const city = searchParams.get("city") || undefined;
		const community = searchParams.get("community") || undefined;

		const data = await getMarketReportData({ city, community });

		return NextResponse.json({
			success: true,
			data,
		});
	} catch (error: any) {
		console.error("Market Report API Error:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to load market report data",
			},
			{ status: 500 }
		);
	}
}
