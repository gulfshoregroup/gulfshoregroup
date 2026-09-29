import { NextRequest } from "next/server";
import { processSavedSearches } from "@/jobs/processSavedSearches";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds (or more if on Vercel Pro/Enterprise)

/**
 * Daily Alerts cron endpoint.
 *
 * Set a cron job in cron-job.org to hit this URL once a day (e.g., at 8 AM):
 *   GET /api/v2/cron/send-daily-alerts
 *
 * Idempotency guard: rejects any duplicate calls within 5 minutes so that
 * cron-job.org retries (triggered when the long background job doesn't respond
 * fast enough) never cause a second SMS/Email blast to the same users.
 */

// In-memory guard — persists across requests within the same serverless instance lifetime
let lastRunAt: number | null = null;
const MIN_RUN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
	// Optional: protect with a secret token
	const token = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("token");
	const expectedToken = process.env.CRON_SECRET;
	if (expectedToken && token !== expectedToken) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Idempotency: block duplicate triggers within 5 minutes
	const now = Date.now();
	if (lastRunAt !== null && now - lastRunAt < MIN_RUN_INTERVAL_MS) {
		const secondsAgo = Math.floor((now - lastRunAt) / 1000);
		console.warn(`[Cron] Duplicate trigger blocked — last run was ${secondsAgo}s ago.`);
		return Response.json(
			{ success: false, message: `Already triggered ${secondsAgo}s ago. Skipping to prevent duplicate alerts.` },
			{ status: 429 }
		);
	}
	lastRunAt = now;

	try {
		console.log("[Cron] Daily alerts triggered.");

		// Run non-blockingly to avoid 30s cron-job.org timeout on Railway
		processSavedSearches()
			.then(() => console.log("[Cron] Background daily alerts completed."))
			.catch((err) => console.error("[Cron] Background daily alerts error:", err));

		return Response.json({
			success: true,
			message: "Daily alerts processing started in background",
			triggeredAt: new Date().toISOString(),
		});
	} catch (err: any) {
		console.error("[Cron] Route error:", err?.message);
		return Response.json(
			{ success: false, error: err?.message || "Alerts processing failed" },
			{ status: 500 }
		);
	}
}
