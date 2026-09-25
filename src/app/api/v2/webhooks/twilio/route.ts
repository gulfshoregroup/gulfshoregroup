import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import prisma from "@/lib/prisma";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
	try {
		// Twilio sends data as URL-encoded form data
		const formData = await req.formData();
		const From = formData.get("From") as string;
		const Body = formData.get("Body") as string;

		if (!From || !Body) {
			return new NextResponse("Missing data", { status: 400 });
		}

		// Clean phone number to match last 10 digits reliably
		const cleanPhone = From.replace(/\D/g, "");
		const last10Digits = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

		// 1. Find lead by phone number
		let lead = await prisma.lead.findFirst({
			where: {
				OR: [
					{ phone: From },
					{ phone: { contains: last10Digits } }
				]
			}
		});

		// If no lead exists, create a lead record to track SMS history
		if (!lead) {
			lead = await prisma.lead.create({
				data: {
					phone: From,
					email: `${cleanPhone || Date.now()}@placeholder.com`,
					source: "SMS Incoming",
				}
			});
		}

		// 2. Save user message to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "sms",
				role: "user",
				message: Body,
			}
		});

		// 3. Fetch past conversation history for context
		const pastChats = await prisma.aIChatHistory.findMany({
			where: { leadId: lead.id, channel: "sms" },
			orderBy: { createdAt: "asc" },
			take: 10,
		});

		const messages: any = pastChats.map((chat: any) => ({
			role: chat.role === "ai" ? "assistant" : chat.role,
			content: chat.message,
		}));

		// 4. Generate AI Response
		const { text } = await generateText({
			model: openai("gpt-4o-mini"),
			system: `${AI_SYSTEM_PROMPT}

CRITICAL SMS INSTRUCTIONS:
You are texting with a lead via SMS. Keep your responses short, friendly, and conversational (under 160 characters if possible).
Ask qualifying questions about budget, location, and timeline to buy/sell.`,
			messages,
		});

		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "sms",
				role: "ai",
				message: text,
			}
		});

		// Recalculate score asynchronously after the chat interaction
		import("@/lib/leads/services/scoring.service").then(({ recalculateLeadScore }) => {
			recalculateLeadScore(lead.id);
		});

		// 6. Return TwiML so Twilio sends the SMS back to the user
		const twiml = `
			<Response>
				<Message>${text}</Message>
			</Response>
		`;

		return new NextResponse(twiml, {
			headers: { "Content-Type": "text/xml" },
		});
	} catch (error) {
		console.error("Twilio Webhook Error:", error);
		return new NextResponse(`
			<Response>
				<Message>Sorry, our system is currently busy. Dimitri will get back to you shortly.</Message>
			</Response>
		`, {
			headers: { "Content-Type": "text/xml" },
		});
	}
}
