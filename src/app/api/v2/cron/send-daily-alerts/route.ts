import { NextRequest } from "next/server";
import { processSavedSearches } from "@/jobs/processSavedSearches";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // 60 seconds (or more if on Vercel Pro/Enterprise)

/**
 * Daily Alerts cron endpoint.
 *
 * Set a cron job in cron-job.org to hit this URL once a day (e.g., at 8 AM):
 *   GET /api/v2/cron/send-daily-alerts
 *
 * Idempotency guard: rejects any duplicate calls within 15 minutes so that
 * cron-job.org retries (triggered when the long background job doesn't respond
 * fast enough) never cause a second SMS/Email blast to the same users.
 */

const MIN_RUN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(req: NextRequest) {
	// Optional: protect with a secret token
	const token = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("token");
	const expectedToken = process.env.CRON_SECRET;
	if (expectedToken && token !== expectedToken) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Idempotency: block duplicate triggers within 15 minutes using DB lock
	const now = new Date(Date.now() - MIN_RUN_INTERVAL_MS);
	const recentLock = await prisma.communicationLog.findFirst({
		where: {
			type: "Cron_DailyAlerts",
			createdAt: { gte: now }
		}
	});

	if (recentLock) {
		console.warn(`[Cron] Duplicate trigger blocked by DB lock.`);
		return Response.json(
			{ success: false, message: `Already triggered recently. Skipping to prevent duplicate alerts.` },
			{ status: 429 }
		);
	}

	// Create a lock
	await prisma.communicationLog.create({
		data: {
			type: "Cron_DailyAlerts",
			to: "System",
			status: "Started",
			message: "Daily alerts cron lock"
		}
	});

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
