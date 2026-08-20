import { NextRequest } from "next/server";
import { syncTodaysActiveProperties } from "@/jobs/syncProperties";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const forceDate = searchParams.get("date");

	const lastFetched = await prisma.property.findMany({
		where: {
			StandardStatus: "Active",
		},
		orderBy: {
			BridgeModificationTimestamp: "desc",
		},
		select: {
			BridgeModificationTimestamp: true,
		},
		take: 1,
	});

	// Use BridgeModificationTimestamp (not createdAt) as the base for incremental sync
	const lastModifiedAt = lastFetched[0]?.BridgeModificationTimestamp;

	// Default to 7 days ago if DB is empty
	const defaultStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
		.toISOString()
		.split("T")[0];

	// Look back an extra 2 days from the last known modification to avoid gaps
	let queryDate: string;
	if (forceDate) {
		queryDate = forceDate;
	} else if (lastModifiedAt) {
		const lookback = new Date(lastModifiedAt.getTime() - 2 * 24 * 60 * 60 * 1000);
		queryDate = lookback.toISOString().split("T")[0];
	} else {
		queryDate = defaultStartDate;
	}

	console.log(`[Sync Route] Starting sync — modification lookback: ${queryDate}`);

	await syncTodaysActiveProperties({ count: 0, date: queryDate });

	return Response.json({ success: true, date: queryDate });
}
