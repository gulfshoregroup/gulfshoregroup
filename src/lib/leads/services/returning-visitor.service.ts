import prisma from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/safeRedis";
import { sendSMS } from "@/lib/twilio";

/**
 * Checks if a lead has returned to the website after being inactive for 7 days.
 * If they are a returning dormant lead, sends an SMS to the Admin.
 * Automatically refreshes their "last active" timer in Redis.
 */
export async function checkAndSendReturningVisitorAlert(
	leadId: string,
	leadName: string,
	leadPhone: string | null
): Promise<void> {
	try {
		// 1. Fetch the lead to check their createdAt date
		const lead = await prisma.lead.findUnique({
			where: { id: leadId },
			select: { createdAt: true }
		});

		if (!lead) return;

		// 2. Define Thresholds
		const INACTIVITY_DAYS = 7;
		const REDIS_TTL_SECONDS = INACTIVITY_DAYS * 24 * 60 * 60; // 7 days in seconds

		// 3. Ignore brand new leads (created within the last 7 days)
		// They can't be "returning" if they haven't existed for 7 days yet.
		const isBrandNewLead = (Date.now() - lead.createdAt.getTime()) < (INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
		if (isBrandNewLead) {
			// Just set their active status in Redis so they are tracked for the future
			const redisKey = `last_active:${leadId}`;
			await redisSet(redisKey, true, REDIS_TTL_SECONDS);
			return;
		}

		// 4. Check if we already sent an alert in the last 7 days via DB Note
		const lookbackDateForAlert = new Date(Date.now() - REDIS_TTL_SECONDS * 1000);
		const recentAlert = await prisma.note.findFirst({
			where: {
				leadId: leadId,
				message: { startsWith: "[SYSTEM_ALERT] Returning Lead SMS sent" },
				createdAt: { gte: lookbackDateForAlert }
			}
		});

		// Check Redis as backup for actual activity, but rely on DB to prevent spam
		const redisKey = `last_active:${leadId}`;
		const wasActiveRecently = await redisGet(redisKey);
		
		if (!wasActiveRecently && !recentAlert) {
			// 🔥 They haven't been active in 7+ days (Redis key expired/missing)
			// Send the Returning Visitor Alert!
			const adminPhone = process.env.PROPERTY_ALERT_PHONE;
			
			if (adminPhone) {
				const contactStr = leadPhone ? `Call them: ${leadPhone}` : "Email them via CRM.";
				const message = `👋 RETURNING LEAD: ${leadName || 'A lead'} just returned to the website after being inactive for over a week! ${contactStr}`;
				
				await sendSMS(adminPhone, message);
				console.log(`[ReturningVisitorAlert] Sent SMS to Admin for lead ${leadId}: ${message}`);
				// Log in DB Note to prevent spamming
				await prisma.note.create({
					data: {
						leadId: leadId,
						message: "[SYSTEM_ALERT] Returning Lead SMS sent to Admin.",
					}
				});
			} else {
				console.warn("[ReturningVisitorAlert] Returning lead detected, but PROPERTY_ALERT_PHONE is not set in env.");
			}
		}

		// 5. Always refresh their active timer to exactly 7 days from right now (Redis)
		await redisSet(redisKey, true, REDIS_TTL_SECONDS);

	} catch (error) {
		console.error(`[ReturningVisitorAlert] Failed to process alert for lead ${leadId}:`, error);
	}
}
