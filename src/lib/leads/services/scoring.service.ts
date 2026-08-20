import prisma from "@/lib/prisma";

/**
 * Proposed Scoring Rules (Points):
 * - +1 Point = For every property viewed
 * - +5 Points = For every property saved to wishlist
 * - +10 Points = For every saved search alert created
 * - +15 Points = For every AI Chat interaction or SMS sent
 */

/**
 * Recalculates the lead score based on their activities and updates the database.
 */
export async function recalculateLeadScore(leadId: string): Promise<void> {
	try {
		// 1. Get counts
		const viewedPropertiesCount = await prisma.viewedProperty.count({
			where: { userId: leadId },
		});

		const savedPropertiesCount = await prisma.savedProperty.count({
			where: { leadId },
		});

		const savedSearchesCount = await prisma.savedSearch.count({
			where: { userId: leadId },
		});

		const aiChatsCount = await prisma.aIChatHistory.count({
			where: { leadId, role: "user" }, // only count user messages to avoid double counting AI replies
		});

		// 2. Calculate score
		const score = 
			(viewedPropertiesCount * 1) + 
			(savedPropertiesCount * 5) + 
			(savedSearchesCount * 10) + 
			(aiChatsCount * 15);

		// 3. Determine label
		let scoreLabel = "Cold";
		if (score >= 61) {
			scoreLabel = "Ready to Buy";
		} else if (score >= 36) {
			scoreLabel = "Hot";
		} else if (score >= 16) {
			scoreLabel = "Warm";
		}

		// 4. Update the lead
		await prisma.lead.update({
			where: { id: leadId },
			data: {
				score,
				scoreLabel,
			},
		});

		console.log(`[LeadScoring] Updated Lead ${leadId}: Score=${score}, Label=${scoreLabel}`);
	} catch (error) {
		console.error(`[LeadScoring] Failed to recalculate score for lead ${leadId}:`, error);
	}
}
