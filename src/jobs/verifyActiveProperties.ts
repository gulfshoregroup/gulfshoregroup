import prisma from "../lib/prisma";

const BATCH_SIZE = 50;
const BASE_URL = process.env.BRIDGE_BASE_URL || "https://api.bridgedataoutput.com/api/v2";
const API_KEY = process.env.BRIDGE_API_KEY as string;
const SOURCE = process.env.BRIDGE_SOURCE || "nabor";

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates a chunk of active properties against the Bridge API.
 * If a ListingId is not returned by the API, it marks it as verificationPendingAt,
 * or sets it to Expired if it has been pending for over 24 hours.
 */
async function processVerificationChunk(properties: { id: string; ListingId: string; verificationPendingAt: Date | null }[]) {
	if (properties.length === 0) return { checked: 0, pending: 0, expired: 0 };

	const listingIds = properties.map((p) => p.ListingId);
	const filter = `ListingId.in=${listingIds.join(",")}`;

	const url =
		`${BASE_URL}/${SOURCE}/listings` +
		`?access_token=${API_KEY}` +
		`&limit=${BATCH_SIZE}` +
		`&${filter}`;

	let res: Response;
	try {
		res = await fetch(url);
	} catch (err: any) {
		console.error(`[VerifyActive] Fetch error: ${err.message}`);
		return { checked: 0, pending: 0, expired: 0 }; // Fail safe, don't expire anything
	}

	if (!res.ok) {
		console.error(`[VerifyActive] API error: ${res.status}`);
		return { checked: 0, pending: 0, expired: 0 }; // Fail safe
	}

	const data = await res.json();
	const returnedListings: any[] = data.bundle || [];
	const returnedListingMap = new Map<string, any>(
		returnedListings.map((l: any) => [l.ListingId, l])
	);

	let pendingCount = 0;
	let expiredCount = 0;
	const now = new Date();
	// 20h (not 24h) so a listing flagged on one daily run expires on the next daily run,
	// even if that batch gets processed a few minutes earlier than the day before.
	const twentyFourHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

	for (const prop of properties) {
		const returned = returnedListingMap.get(prop.ListingId);
		if (returned) {
			const bridgeStatus = returned.StandardStatus || returned.MlsStatus;
			if (
				bridgeStatus &&
				["Expired", "Withdrawn", "Canceled", "Closed", "Pending"].includes(bridgeStatus)
			) {
				// Bridge explicitly reports this property is no longer Active!
				const newStatus =
					bridgeStatus === "Withdrawn" || bridgeStatus === "Canceled"
						? "Expired"
						: bridgeStatus;
				await prisma.property.update({
					where: { id: prop.id },
					data: {
						StandardStatus: newStatus,
						verificationPendingAt: null,
					},
				});
				if (newStatus === "Expired") {
					expiredCount++;
					console.log(`[VerifyActive] Property ${prop.ListingId} updated to Expired from Bridge.`);
				}
			} else if (prop.verificationPendingAt) {
				// It exists and is Active in Bridge API. Clear pending flag.
				await prisma.property.update({
					where: { id: prop.id },
					data: { verificationPendingAt: null },
				});
			}
		} else {
			// Missing from Bridge API feed!
			if (!prop.verificationPendingAt) {
				// Mark as pending
				await prisma.property.update({
					where: { id: prop.id },
					data: { verificationPendingAt: now },
				});
				pendingCount++;
			} else if (prop.verificationPendingAt < twentyFourHoursAgo) {
				// It has been pending for > 24 hours. Expire it.
				await prisma.property.update({
					where: { id: prop.id },
					data: {
						StandardStatus: "Expired",
						verificationPendingAt: null, // clear flag
					},
				});
				expiredCount++;
				console.log(`[VerifyActive] Property ${prop.ListingId} marked as Expired.`);
			} else {
				// Still in the 24 hour waiting period
				pendingCount++;
			}
		}
	}

	return { checked: properties.length, pending: pendingCount, expired: expiredCount };
}

/**
 * Main job to verify all Active properties in the database.
 */
export async function verifyActiveProperties(options: { maxBatches?: number } = {}) {
	console.log(`[VerifyActive] Starting verification job...`);

	// Cursor-based pagination on `id` (immutable). Using skip + updatedAt caused rows to
	// shift (updates bump updatedAt, expired rows leave the Active set) and get skipped.
	let lastId: string | undefined = undefined;
	let totalChecked = 0;
	let totalPending = 0;
	let totalExpired = 0;
	let batchCount = 0;

	while (true) {
		if (options.maxBatches && batchCount >= options.maxBatches) break;

		const properties: { id: string; ListingId: string; verificationPendingAt: Date | null }[] =
			await prisma.property.findMany({
				where: {
					StandardStatus: "Active",
					...(lastId ? { id: { gt: lastId } } : {}),
				},
				select: { id: true, ListingId: true, verificationPendingAt: true },
				take: BATCH_SIZE,
				orderBy: { id: "asc" },
			});

		if (properties.length === 0) break;

		const result = await processVerificationChunk(properties);
		
		totalChecked += result.checked;
		totalPending += result.pending;
		totalExpired += result.expired;
		batchCount++;

		console.log(`[VerifyActive] Processed batch after id ${lastId ?? "start"}. Total Checked: ${totalChecked}`);
		
		lastId = properties[properties.length - 1].id;

		// Brief pause between Bridge API page fetches
		await sleep(200);
	}

	console.log(`[VerifyActive] Job complete. Checked: ${totalChecked}, Pending: ${totalPending}, Expired: ${totalExpired}`);
	return { totalChecked, totalPending, totalExpired };
}
