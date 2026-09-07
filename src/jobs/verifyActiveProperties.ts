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
	const returnedListingIds = new Set(returnedListings.map((l: any) => l.ListingId));

	let pendingCount = 0;
	let expiredCount = 0;
	const now = new Date();
	const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	for (const prop of properties) {
		if (returnedListingIds.has(prop.ListingId)) {
			// It exists in Bridge API. If it was pending, clear the pending flag.
			if (prop.verificationPendingAt) {
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
export async function verifyActiveProperties() {
	console.log(`[VerifyActive] Starting verification job...`);

	let offset = 0;
	let totalChecked = 0;
	let totalPending = 0;
	let totalExpired = 0;

	while (true) {
		const properties = await prisma.property.findMany({
			where: { StandardStatus: "Active" },
			select: { id: true, ListingId: true, verificationPendingAt: true },
			take: BATCH_SIZE,
			skip: offset,
			orderBy: { updatedAt: "asc" },
		});

		if (properties.length === 0) break;

		const result = await processVerificationChunk(properties);
		
		totalChecked += result.checked;
		totalPending += result.pending;
		totalExpired += result.expired;

		console.log(`[VerifyActive] Processed batch at offset ${offset}. Total Checked: ${totalChecked}`);
		
		offset += BATCH_SIZE;

		// Brief pause between Bridge API page fetches
		await sleep(200);
	}

	console.log(`[VerifyActive] Job complete. Checked: ${totalChecked}, Pending: ${totalPending}, Expired: ${totalExpired}`);
	return { totalChecked, totalPending, totalExpired };
}
