import { NextRequest } from "next/server";
import { processSavedSearches } from "@/jobs/processSavedSearches";

export const dynamic = "force-dynamic";

/**
 * Daily Alerts cron endpoint.
 * 
 * Set a cron job in cron-job.org to hit this URL once a day (e.g., at 8 AM):
 *   GET /api/v2/cron/send-daily-alerts
 * 
 * This ensures users only receive one email per day containing all new properties.
 */
export async function GET(req: NextRequest) {
	// Optional: protect with a secret token
	const token = req.headers.get("x-cron-secret") || req.nextUrl.searchParams.get("token");
	const expectedToken = process.env.CRON_SECRET;
	if (expectedToken && token !== expectedToken) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		console.log("[Cron] Daily alerts triggered.");

		// Process Custom Search Alerts for Leads in background
		setTimeout(() => {
			processSavedSearches().catch(err => {
				console.error("[Cron Background] Daily alerts failed:", err);
			});
		}, 0);

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
