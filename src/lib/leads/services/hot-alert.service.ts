import prisma from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/safeRedis";
import { sendSMS } from "@/lib/twilio";

/**
 * Checks if a lead has spiked in activity (e.g. 5 views in 15 minutes).
 * If so, and we haven't alerted the admin in the last 24 hours, send a Twilio SMS.
 */
export async function checkAndSendHotLeadAlert(
	leadId: string,
	leadName: string,
	leadPhone: string | null
): Promise<void> {
	try {
		// 1. Define thresholds
		const LOOKBACK_MINUTES = 15;
		const VIEW_THRESHOLD = 5;
		const REDIS_TTL_SECONDS = 60 * 60 * 24; // 24 hours

		// 2. Check if we already alerted for this lead recently
		const redisKey = `hot_lead_alert:${leadId}`;
		const alreadyAlerted = await redisGet(redisKey);
		
		if (alreadyAlerted) {
			console.log(`[HotLeadAlert] Alert recently sent for lead ${leadId}. Skipping.`);
			return;
		}

		// 3. Count views in the last X minutes
		const lookbackDate = new Date(Date.now() - LOOKBACK_MINUTES * 60 * 1000);
		
		const recentViewsCount = await prisma.viewedProperty.count({
			where: {
				userId: leadId,
				lastViewedAt: {
					gte: lookbackDate
				}
			}
		});

		// 4. If threshold is met, send SMS to Admin
		if (recentViewsCount >= VIEW_THRESHOLD) {
			const adminPhone = process.env.PROPERTY_ALERT_PHONE;
			
			if (adminPhone) {
				const contactStr = leadPhone ? `Call them now: ${leadPhone}` : "Email them via CRM.";
				const message = `🔥 HOT LEAD ALERT: ${leadName || 'A lead'} just viewed ${recentViewsCount} properties in the last ${LOOKBACK_MINUTES} minutes! ${contactStr}`;
				
				await sendSMS(adminPhone, message);
				console.log(`[HotLeadAlert] Sent SMS to Admin for lead ${leadId}: ${message}`);
				
				// 5. Mark as alerted in Redis to prevent spamming the admin
				await redisSet(redisKey, true, REDIS_TTL_SECONDS);
			} else {
				console.warn("[HotLeadAlert] Threshold met, but PROPERTY_ALERT_PHONE is not set in env.");
			}
		}

	} catch (error) {
		console.error(`[HotLeadAlert] Failed to process alert for lead ${leadId}:`, error);
	}
}
