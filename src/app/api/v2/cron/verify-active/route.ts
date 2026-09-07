import { NextResponse } from "next/server";
import { verifyActiveProperties } from "@/jobs/verifyActiveProperties";

// Allow the script to run for up to 300 seconds (Vercel max for pro, or enough time for cron-job.org)
export const maxDuration = 300;

export async function GET() {
	try {
		console.log(`[VerifyActive Cron] Triggered via API`);
		
		// Run verification
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
