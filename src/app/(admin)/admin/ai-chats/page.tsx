import prisma from "@/lib/prisma";
import AiChatUI from "./AiChatUI";

import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AIChatsPage() {
	// Fetch all chat history, grouped or sorted
	// Let's get up to 5000 most recent messages, including the lead details so no users are cut off
	const chats = await prisma.aIChatHistory.findMany({
		orderBy: { createdAt: "desc" },
		take: 5000,
		include: {
			lead: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
				}
			}
		}
	});

	// Fetch all leads so they appear in the sidebar even if they haven't chatted yet
	const allLeads = await prisma.lead.findMany({
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
		},
		orderBy: { createdAt: "desc" },
		take: 100 // show the latest 100 leads in the sidebar
	});

	// Group them by Lead ID to show conversation threads
	const groupedChats: Record<string, any> = {};
	
	// Initialize all leads with empty messages so they appear in the list
	allLeads.forEach(lead => {
		groupedChats[lead.id] = {
			lead: lead,
			messages: []
		};
	});

	// Populate the ones that actually have chat history
	chats.forEach((chat: any) => {
		if (!groupedChats[chat.leadId]) {
			groupedChats[chat.leadId] = {
				lead: chat.lead,
				messages: []
			};
		}
		groupedChats[chat.leadId].messages.push(chat);
	});

	// Sort leadIds so the ones with the most recent messages appear first
	const leadIds = Object.keys(groupedChats).sort((a, b) => {
		const latestA = groupedChats[a].messages.length > 0 ? new Date(groupedChats[a].messages[0].createdAt).getTime() : 0;
		const latestB = groupedChats[b].messages.length > 0 ? new Date(groupedChats[b].messages[0].createdAt).getTime() : 0;
		return latestB - latestA;
	});

	return (
		<div className="p-4 md:p-6 w-full max-w-7xl mx-auto">
			<Suspense fallback={<div>Loading chats...</div>}>
				<AiChatUI groupedChats={groupedChats} leadIds={leadIds} />
			</Suspense>
		</div>
	);
}
