import { NextResponse } from "next/server";
import { verifyActiveProperties } from "@/jobs/verifyActiveProperties";

// Allow the script to run for up to 300 seconds (Vercel max for pro, or enough time for cron-job.org)
export const maxDuration = 300;

// Prevent overlapping runs if the cron fires again while a previous run is still going
let isRunning = false;

export async function GET(req: Request) {
	try {
		console.log(`[VerifyActive Cron] Triggered via API`);
		
		const url = new URL(req.url);
		// Background is the default so cron-job.org (30s limit) never times out.
		// Pass ?sync=true to run synchronously (manual testing only).
		const runSync = url.searchParams.get("sync") === "true";

		if (isRunning) {
			return NextResponse.json({
				success: true,
				message: "Verification is already running in background.",
			});
		}

		if (!runSync) {
			isRunning = true;
			verifyActiveProperties()
				.then((res) => console.log("[VerifyActive Cron] Completed in background:", res))
				.catch((err) => console.error("[VerifyActive Cron] Background error:", err))
				.finally(() => {
					isRunning = false;
				});

			return NextResponse.json({
				success: true,
				message: "Verification started in background.",
				triggeredAt: new Date().toISOString(),
			});
		}

		// Run verification synchronously
		isRunning = true;
		let result;
		try {
			result = await verifyActiveProperties();
		} finally {
			isRunning = false;
		}

		return NextResponse.json({
			success: true,
			message: "Verification complete.",
			...result,
		});
	} catch (error: any) {
		console.error(`[VerifyActive Cron] Error: ${error.message}`);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
