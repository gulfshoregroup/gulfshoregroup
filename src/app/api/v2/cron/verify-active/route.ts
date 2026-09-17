import { NextResponse } from "next/server";
import { verifyActiveProperties } from "@/jobs/verifyActiveProperties";

// Allow the script to run for up to 300 seconds (Vercel max for pro, or enough time for cron-job.org)
export const maxDuration = 300;

export async function GET(req: NextResponse) {
	try {
		console.log(`[VerifyActive Cron] Triggered via API`);
		
		const url = new URL(req.url);
		const isAsync = url.searchParams.get("async") === "true";

		if (isAsync) {
			verifyActiveProperties()
				.then((res) => console.log("[VerifyActive Cron] Completed in background:", res))
				.catch((err) => console.error("[VerifyActive Cron] Background error:", err));

			return NextResponse.json({
				success: true,
				message: "Verification started in background.",
				triggeredAt: new Date().toISOString(),
			});
		}

		// Run verification synchronously
		const result = await verifyActiveProperties();

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
