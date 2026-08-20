import prisma from "@/lib/prisma";
import AiChatUI from "./AiChatUI";

import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function AIChatsPage() {
	// Fetch all chat history, grouped or sorted
	// Let's get the 100 most recent messages, including the lead details
	const chats = await prisma.aIChatHistory.findMany({
		orderBy: { createdAt: "desc" },
		take: 100,
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

	// Group them by Lead ID to show conversation threads
	const groupedChats = chats.reduce((acc: any, chat: any) => {
		if (!acc[chat.leadId]) {
			acc[chat.leadId] = {
				lead: chat.lead,
				messages: []
			};
		}
		acc[chat.leadId].messages.push(chat);
		return acc;
	}, {});

	const leadIds = Object.keys(groupedChats);

	return (
		<div className="p-4 md:p-6 w-full max-w-7xl mx-auto">
			<Suspense fallback={<div>Loading chats...</div>}>
				<AiChatUI groupedChats={groupedChats} leadIds={leadIds} />
			</Suspense>
		</div>
	);
}
