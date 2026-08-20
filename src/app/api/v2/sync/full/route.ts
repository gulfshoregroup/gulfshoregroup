import { NextRequest } from "next/server";
import { fetchAllBridgeListings } from "@/lib/bridge";
import { mapProperty } from "@/lib/mapProperty";
import prisma from "@/lib/prisma";

const BATCH_SIZE = 200;   // How many to fetch from Bridge per API call
const DB_CHUNK_SIZE = 50; // How many to write to DB at a time

function sleep(ms: number) {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Upsert a single property with fallback on ListingId conflict.
 */
async function upsertOne(item: any): Promise<"ok" | "skip" | "fail"> {
	const mapped = mapProperty(item);
	try {
		await prisma.property.upsert({
			where: { ListingKey: item.ListingKey },
			update: mapped,
			create: mapped,
		});
		return "ok";
	} catch (err: any) {
		const msg: string = err?.message ?? "";

		// Fallback: ListingId unique conflict
		if (msg.includes("Unique constraint") && msg.includes("ListingId")) {
			try {
				const existing = await prisma.property.findUnique({
					where: { ListingId: item.ListingId },
					select: { id: true },
				});
				if (existing) {
					await prisma.property.update({ where: { id: existing.id }, data: mapped });
					return "ok";
				}
			} catch {
				return "fail";
			}
		}

		// Retry once for connection errors
		if (
			msg.includes("Transaction already closed") ||
			msg.includes("connection closed") ||
			msg.includes("ECONNRESET")
		) {
			await sleep(1500);
			try {
				await prisma.property.upsert({
					where: { ListingKey: item.ListingKey },
					update: mapped,
					create: mapped,
				});
				return "ok";
			} catch {
				return "fail";
			}
		}

		console.error(`[FullSync] Failed ${item.ListingId}: ${msg}`);
		return "fail";
	}
}

/**
 * ⚡ FULL SYNC ENDPOINT
 *
 * Fetches EVERY property from Bridge API (no date filter) and upserts into DB.
 * Supports resume via ?offset=N so you can restart from where it stopped.
 *
 * Usage:
 *   GET /api/v2/sync/full            → Start from offset 0
 *   GET /api/v2/sync/full?offset=400 → Resume from offset 400
 *   GET /api/v2/sync/full?status=Closed → Sync sold/closed properties
 *
 * Response includes `nextOffset` so you can chain calls if needed.
 */
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	let cursor = searchParams.get("cursor"); // ISO string timestamp
	const status = searchParams.get("status") || "Active";

	// Max batches per single HTTP request (to avoid Railway proxy timeout)
	// Each batch = 200 properties. 2 batches = 400 properties per call.
	const MAX_BATCHES_PER_REQUEST = 2;

	let totalFetched = 0;
	let totalSuccess = 0;
	let totalFailed = 0;
	let batchCount = 0;

	console.log(`[FullSync] Starting full sync — status: ${status}, cursor: ${cursor}`);

	while (batchCount < MAX_BATCHES_PER_REQUEST) {
		// --- Fetch from Bridge ---
		let data: any;
		try {
			data = await fetchAllBridgeListings(cursor, BATCH_SIZE, status);
		} catch (fetchErr: any) {
			console.error(`[FullSync] Fetch failed at cursor ${cursor}: ${fetchErr?.message}`);
			break;
		}

		const listings: any[] = data.bundle || [];
		if (listings.length === 0) {
			console.log(`[FullSync] No more listings at cursor ${cursor}. Done!`);
			cursor = null; // signal: fully complete
			break;
		}

		// --- Write to DB in sub-chunks ---
		for (let i = 0; i < listings.length; i += DB_CHUNK_SIZE) {
			const chunk = listings.slice(i, i + DB_CHUNK_SIZE);
			for (const item of chunk) {
				const result = await upsertOne(item);
				if (result === "ok") totalSuccess++;
				else totalFailed++;
			}
			if (i + DB_CHUNK_SIZE < listings.length) await sleep(100);
		}

		totalFetched += listings.length;
		
		const lastListing = listings[listings.length - 1];
		if (lastListing?.BridgeModificationTimestamp) {
			cursor = lastListing.BridgeModificationTimestamp;
		}
		
		batchCount++;

		console.log(
			`[FullSync] Batch ${batchCount}: cursor=${cursor}, fetched=${totalFetched}, success=${totalSuccess}, failed=${totalFailed}`
		);

		if (listings.length < BATCH_SIZE) {
			// Last page — we're done
			cursor = null; // signal: fully complete
			break;
		}

		await sleep(300); // Breathe between Bridge API calls
	}

	const isComplete = cursor === null;

	return Response.json({
		success: true,
		status,
		totalFetched,
		totalSuccess,
		totalFailed,
		nextCursor: cursor,
		isComplete,
		message: isComplete
			? `✅ Full sync complete! All ${status} properties synced.`
			: `Synced ${totalFetched} properties. Call again with ?cursor=${cursor}&status=${status} to continue.`,
	});
}
