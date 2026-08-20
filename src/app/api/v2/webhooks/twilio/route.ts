import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		// Twilio sends data as URL-encoded form data
		const formData = await req.formData();
		const From = formData.get("From") as string;
		const Body = formData.get("Body") as string;

		if (!From || !Body) {
			return new NextResponse("Missing data", { status: 400 });
		}

		// 1. Find lead by phone number
		let lead = await prisma.lead.findFirst({
			where: { phone: From }
		});

		// If no lead exists, we can optionally create one, or just ignore.
		// For now, let's create a stub lead so we can track the chat.
		if (!lead) {
			lead = await prisma.lead.create({
				data: {
					phone: From,
					email: `${From.replace(/[^0-9]/g, "")}@placeholder.com`, // Email is unique required field
					source: "Other",
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
			system: `You are an expert AI Real Estate Concierge for Gulfshore Group, working on behalf of Dimitri Schwarz. 
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
