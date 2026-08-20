import prisma from "@/lib/prisma";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";

/**
 * Check if a lead has crossed the Hot threshold and send an alert to Dimitri.
 * Call this after any action that might increase a lead's score
 * (property views, search activity, wishlist additions, etc.)
 */
export async function checkAndAlertHotLead(leadId: string): Promise<void> {
	try {
		const lead = await prisma.lead.findUnique({
			where: { id: leadId },
			select: {
				id: true,
				fullName: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				score: true,
				scoreLabel: true,
				budgetMin: true,
				budgetMax: true,
				location: true,
				lastContactedAt: true,
			},
		});

		if (!lead) return;

		// Only alert for Hot or Ready to Buy leads
		if (lead.score < 50) return;

		// Don't send duplicate alerts — check if we alerted recently (within 24h)
		if (lead.lastContactedAt) {
			const hoursSinceLastContact =
				(Date.now() - new Date(lead.lastContactedAt).getTime()) / (1000 * 60 * 60);
			if (hoursSinceLastContact < 24) return;
		}

		const leadName = lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown Lead";
		const scoreEmoji = lead.score >= 75 ? "💰" : "🔥";
		const scoreText = lead.score >= 75 ? "READY TO BUY" : "HOT LEAD";

		// Build budget string
		let budgetStr = "Not specified";
		if (lead.budgetMin || lead.budgetMax) {
			const min = lead.budgetMin ? `$${lead.budgetMin.toLocaleString()}` : "";
			const max = lead.budgetMax ? `$${lead.budgetMax.toLocaleString()}` : "";
			budgetStr = min && max ? `${min} - ${max}` : min || max;
		}

		// Send admin email alert
		await sendAdminLeadAlertEmail({
			action: "inquiry",
			leadName,
			leadEmail: lead.email,
			timestamp: new Date(),
			message: `${scoreEmoji} ${scoreText} ALERT!\n\nLead: ${leadName}\nEmail: ${lead.email}\n${lead.phone ? `Phone: ${lead.phone}\n` : ""}Score: ${lead.score}/100 (${lead.scoreLabel})\nBudget: ${budgetStr}\nLocation: ${lead.location || "Not specified"}\n\nThis lead is highly engaged. Reach out ASAP!\n\n— GulfshoreGroup.com CRM`,
		});

		// Send SMS alert to Dimitri if Twilio is configured
		if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_NUMBER) {
			try {
				const adminPhone = process.env.ADMIN_ALERT_PHONE || "+12399929119";
				const smsBody = `${scoreEmoji} ${scoreText}: ${leadName} (${lead.email})${lead.phone ? ` | ${lead.phone}` : ""} — Score: ${lead.score}. Budget: ${budgetStr}. Location: ${lead.location || "N/A"}. — GulfShoreGroup.com`;

				const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`;
				const auth = Buffer.from(`${process.env.TWILIO_SID}:${process.env.TWILIO_TOKEN}`).toString("base64");

				await fetch(twilioUrl, {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Authorization: `Basic ${auth}`,
					},
					body: new URLSearchParams({
						To: adminPhone,
						From: process.env.TWILIO_NUMBER!,
						Body: smsBody,
					}).toString(),
				});
			} catch (smsErr) {
				console.error("[Hot Lead Alert] SMS failed:", smsErr);
			}
		}

		// Update lastContactedAt so we don't spam alerts
		await prisma.lead.update({
			where: { id: leadId },
			data: { lastContactedAt: new Date() },
		});

		console.log(`[Hot Lead Alert] Sent alert for lead ${leadId} (score: ${lead.score})`);
	} catch (err) {
		console.error("[Hot Lead Alert] Error:", err);
	}
}

/**
 * Recalculate a lead's score based on their activity.
 * Call this after tracking a new activity (view, search, save, etc.)
 */
export async function recalculateLeadScore(leadId: string): Promise<void> {
	try {
		const lead = await prisma.lead.findUnique({
			where: { id: leadId },
			select: {
				id: true,
				score: true,
				_count: {
					select: {
						viewHistory: true,
						savedProperties: true,
						savedSearch: true,
						searchHistory: true,
						inquiryHistory: true,
						aiChats: true,
					},
				},
			},
		});

		if (!lead) return;

		// Score calculation:
		// Property views: 2 pts each (max 20)
		// Saved properties: 5 pts each (max 25)
		// Saved searches: 5 pts each (max 15)
		// Search queries: 1 pt each (max 10)
		// Inquiries/Tours: 10 pts each (max 20)
		// AI Chats: 1 pt each (max 10)

		const viewScore = Math.min(lead._count.viewHistory * 2, 20);
		const savedScore = Math.min(lead._count.savedProperties * 5, 25);
		const searchSavedScore = Math.min(lead._count.savedSearch * 5, 15);
		const searchScore = Math.min(lead._count.searchHistory * 1, 10);
		const inquiryScore = Math.min(lead._count.inquiryHistory * 10, 20);
		const chatScore = Math.min(lead._count.aiChats * 1, 10);

		const totalScore = viewScore + savedScore + searchSavedScore + searchScore + inquiryScore + chatScore;
		const clampedScore = Math.min(totalScore, 100);

		// Determine label
		let scoreLabel = "Cold";
		if (clampedScore >= 76) scoreLabel = "Ready to Buy";
		else if (clampedScore >= 51) scoreLabel = "Hot";
		else if (clampedScore >= 26) scoreLabel = "Warm";

		const previousScore = lead.score;

		// Update lead score
		await prisma.lead.update({
			where: { id: leadId },
			data: {
				score: clampedScore,
				scoreLabel,
			},
		});

		// If score crossed into Hot territory, send alert
		if (previousScore < 50 && clampedScore >= 50) {
			await checkAndAlertHotLead(leadId);
		}
	} catch (err) {
		console.error("[Lead Score] Error recalculating:", err);
	}
}
