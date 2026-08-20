import prisma from "../lib/prisma";
import { fetchBridgeBatch, fetchBridgeBatchByOnMarketDate } from "@/lib/bridge";
import { mapProperty } from "../lib/mapProperty";

const BATCH_SIZE = 200;
const DB_CHUNK_SIZE = 50; // Process DB writes in smaller chunks to avoid connection exhaustion
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Sleep helper
 */
function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upsert a single property with retry logic.
 * Uses ListingKey as the unique identifier for upsert.
 * Falls back to update-by-id if the standard upsert hits a constraint
 * conflict caused by the secondary unique key (ListingId).
 */
async function upsertPropertyWithRetry(item: any): Promise<void> {
	const mapped = mapProperty(item);

	for (let attempt = 1; attempt <= RETRY_LIMIT; attempt++) {
		try {
			// Try standard Prisma upsert first
			await prisma.property.upsert({
				where: { ListingKey: item.ListingKey },
				update: mapped,
				create: mapped,
			});
			return; // success
		} catch (err: any) {
			const msg: string = err?.message ?? "";

			// --- Handle: unique constraint on ListingId (secondary unique key conflict) ---
			// This happens when a property exists with this ListingId but a DIFFERENT ListingKey
			if (
				msg.includes("Unique constraint") &&
				msg.includes("ListingId") &&
				attempt === 1
			) {
				try {
					const existingByListingId = await prisma.property.findUnique({
						where: { ListingId: item.ListingId },
						select: { id: true, ListingKey: true },
					});

					if (existingByListingId) {
						await prisma.property.update({
							where: { id: existingByListingId.id },
							data: mapped,
						});
						return;
					}
				} catch (innerErr: any) {
					console.error(
						`[Sync] Fallback update failed for ${item.ListingId}: ${innerErr?.message}`
					);
				}
				return; // Don't retry further for this type of error
			}

			// --- Handle: transaction/connection errors — retry with back-off ---
			if (
				msg.includes("Transaction already closed") ||
				msg.includes("connection closed") ||
				msg.includes("ECONNRESET") ||
				msg.includes("ER_CON_COUNT_ERROR")
			) {
				if (attempt < RETRY_LIMIT) {
					const delay = RETRY_DELAY_MS * attempt;
					console.warn(
						`[Sync] Connection error for ${item.ListingId} (attempt ${attempt}/${RETRY_LIMIT}), retrying in ${delay}ms...`
					);
					await sleep(delay);
					continue;
				}
			}

			// Final attempt failed or unrecognized error — log and skip
			if (attempt === RETRY_LIMIT) {
				console.error(
					`[Sync] Failed to sync property ${item.ListingId} after ${RETRY_LIMIT} attempts: ${msg}`
				);
			} else if (attempt === 1) {
				console.error(`[Sync] Failed to sync property ${item.ListingId}: ${msg}`);
				return;
			}
		}
	}
}

/**
 * Process a chunk of listings sequentially to avoid overwhelming the connection pool.
 */
async function processChunk(
	listings: any[],
): Promise<{ success: number; failed: number }> {
	let success = 0;
	let failed = 0;

	for (const item of listings) {
		try {
			await upsertPropertyWithRetry(item);
			success++;
		} catch {
			failed++;
		}
	}

	return { success, failed };
}

/**
 * Run a paginated sync pass against the Bridge API.
 * `fetchFn` is either the BridgeModificationTimestamp or OnMarketDate fetcher.
 */
export async function runSyncPass(
	passName: string,
	fetchFn: (offset: number, limit: number, date: string, status: string) => Promise<any>,
	date: string,
	status: string
): Promise<{ totalFetched: number; totalSuccess: number; totalFailed: number }> {
	let offset = 0;
	let totalFetched = 0;
	let totalSuccess = 0;
	let totalFailed = 0;

	console.log(`[Sync] Starting ${passName} pass from: ${date}`);

	while (true) {
		let data: any;
		try {
			data = await fetchFn(offset, BATCH_SIZE, date, status);
		} catch (fetchErr: any) {
			console.error(`[Sync] ${passName} fetch failed at offset ${offset}: ${fetchErr?.message}`);
			break;
		}

		const listings: any[] = data.bundle || [];
		if (listings.length === 0) break;

		// Write to DB in smaller sub-chunks to protect the connection pool
		for (let i = 0; i < listings.length; i += DB_CHUNK_SIZE) {
			const chunk = listings.slice(i, i + DB_CHUNK_SIZE);
			const { success, failed } = await processChunk(chunk);
			totalSuccess += success;
			totalFailed += failed;

			// Brief pause between DB chunks to let the connection pool breathe
			if (i + DB_CHUNK_SIZE < listings.length) {
				await sleep(100);
			}
		}

		totalFetched += listings.length;
		offset += BATCH_SIZE;

		console.log(
			`[Sync] ${passName} — fetched: ${totalFetched}, success: ${totalSuccess}, failed: ${totalFailed}`
		);

		if (listings.length < BATCH_SIZE) break;

		// Brief pause between Bridge API page fetches
		await sleep(200);
	}

	return { totalFetched, totalSuccess, totalFailed };
}

/**
 * Main sync entry point.
 *
 * Runs TWO passes:
 *  1. BridgeModificationTimestamp pass — catches price changes, status updates, etc.
 *  2. OnMarketDate pass (always last 2 days) — catches NEW listings that just hit the MLS
 *     and may have an older BridgeModificationTimestamp.
 */
export async function syncTodaysActiveProperties({
	count,
	date,
	forceAll = false,
}: {
	count: number;
	date?: string;
	forceAll?: boolean;
}) {
	// Use the provided date from the cron router (which correctly looks back to last sync)
	// or fallback to 7 days ago for safety.
	const fallbackDate = new Date();
	fallbackDate.setDate(fallbackDate.getDate() - 7);
	const defaultDate = fallbackDate.toISOString().split("T")[0];
	
	const modificationDate = forceAll ? "2000-01-01" : (date || defaultDate);
	const newListingsDate = forceAll ? "2000-01-01" : (date || defaultDate);
	
	const oneYearAgoDate = new Date();
	oneYearAgoDate.setFullYear(oneYearAgoDate.getFullYear() - 1);
	const soldDate = forceAll ? oneYearAgoDate.toISOString().split("T")[0] : modificationDate;

	console.log(`[Sync] === Bridge Sync Started ===`);
	console.log(`[Sync] forceAll mode: ${forceAll}`);
	console.log(`[Sync] Modification pass date: ${modificationDate}`);
	console.log(`[Sync] New listings (OnMarketDate) pass date: ${newListingsDate}`);
	console.log(`[Sync] Sold listings pass date: ${soldDate}`);

	// --- Pass 1: Modification timestamp (updates + existing listings) ---
	const pass1 = await runSyncPass(
		"BridgeModificationTimestamp",
		fetchBridgeBatch,
		modificationDate,
		"Active"
	);

	// --- Pass 2: OnMarketDate (brand new listings that came to market recently) ---
	const pass2 = await runSyncPass(
		"OnMarketDate",
		fetchBridgeBatchByOnMarketDate,
		newListingsDate,
		"Active"
	);

	// --- Pass 3: Closed properties (recently sold) ---
	const pass3 = await runSyncPass(
		"BridgeModificationTimestamp_Closed",
		fetchBridgeBatch,
		soldDate,
		"Closed"
	);

	// --- Pass 4: Pending properties (recently pending) ---
	const pass4 = await runSyncPass(
		"BridgeModificationTimestamp_Pending",
		fetchBridgeBatch,
		modificationDate,
		"Pending"
	);

	// --- Pass 5: OnMarketDate Pending (brand new pending listings) ---
	const pass5 = await runSyncPass(
		"OnMarketDate_Pending",
		fetchBridgeBatchByOnMarketDate,
		newListingsDate,
		"Pending"
	);

	const totalFetched = pass1.totalFetched + pass2.totalFetched + pass3.totalFetched + pass4.totalFetched + pass5.totalFetched;
	const totalSuccess = pass1.totalSuccess + pass2.totalSuccess + pass3.totalSuccess + pass4.totalSuccess + pass5.totalSuccess;
	const totalFailed = pass1.totalFailed + pass2.totalFailed + pass3.totalFailed + pass4.totalFailed + pass5.totalFailed;

	console.log(`[Sync] === Bridge Sync Completed ===`);
	console.log(`[Sync] Total fetched: ${totalFetched}, success: ${totalSuccess}, failed: ${totalFailed}`);
}
