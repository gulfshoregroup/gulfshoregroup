import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

let cache: { groupedChats: Record<string, any>; leadIds: string[]; ts: number } | null = null;
const CACHE_TTL_MS = 10_000;

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const forceRefresh = searchParams.get("refresh") === "1";

		if (!forceRefresh && cache && Date.now() - cache.ts < CACHE_TTL_MS) {
			return NextResponse.json({
				success: true,
				groupedChats: cache.groupedChats,
				leadIds: cache.leadIds,
			});
		}

		const [chats, allLeads] = await Promise.all([
			prisma.aIChatHistory.findMany({
				orderBy: { createdAt: "desc" },
				take: 1000,
				include: {
					lead: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true,
							phone: true,
						},
					},
				},
			}),
			prisma.lead.findMany({
				select: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
				},
				orderBy: { createdAt: "desc" },
				take: 100,
			}),
		]);

		const groupedChats: Record<string, any> = {};

		allLeads.forEach((lead) => {
			groupedChats[lead.id] = {
				lead,
				messages: [],
			};
		});

		chats.forEach((chat: any) => {
			if (!groupedChats[chat.leadId]) {
				groupedChats[chat.leadId] = {
					lead: chat.lead,
					messages: [],
				};
			}
			groupedChats[chat.leadId].messages.push(chat);
		});

		const leadIds = Object.keys(groupedChats).sort((a, b) => {
			const latestA =
				groupedChats[a].messages.length > 0
					? new Date(groupedChats[a].messages[0].createdAt).getTime()
					: 0;
			const latestB =
				groupedChats[b].messages.length > 0
					? new Date(groupedChats[b].messages[0].createdAt).getTime()
					: 0;
			return latestB - latestA;
		});

		cache = { groupedChats, leadIds, ts: Date.now() };

		return NextResponse.json({
			success: true,
			groupedChats,
			leadIds,
		});
	} catch (error: any) {
		console.error("Error fetching AI chats:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Failed to fetch AI chats" },
			{ status: 500 }
		);
	}
}

