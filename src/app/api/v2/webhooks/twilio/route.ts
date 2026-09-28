import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import prisma from "@/lib/prisma";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export async function POST(req: NextRequest) {
	try {
		// Twilio sends data as URL-encoded form data
		const formData = await req.formData();
		const From = formData.get("From") as string;
		const Body = formData.get("Body") as string;
		const MessageSid = formData.get("MessageSid") as string;

		console.log(`[Twilio Webhook] Incoming SMS from=${From} body="${Body}" sid=${MessageSid}`);

		if (!From || !Body) {
			console.error("[Twilio Webhook] Missing From or Body");
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
					source: "General",
					status: "New"
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
			role: chat.role === "ai" || chat.role === "admin" ? "assistant" : "user",
			content: chat.message,
		}));

		// 4. Generate AI Response
		let text: string;
		try {
			const result = await generateText({
				model: openai("gpt-4o-mini"),
				system: `${AI_SYSTEM_PROMPT}

CRITICAL SMS INSTRUCTIONS:
You are texting with a lead via SMS. Keep your responses short, friendly, and conversational (under 160 characters if possible).
Ask qualifying questions about budget, location, and timeline to buy/sell.`,
				messages,
			});
			text = result.text;
		} catch (aiError: any) {
			console.error("[Twilio Webhook] OpenAI generateText failed:", {
				message: aiError?.message,
				stack: aiError?.stack,
				status: aiError?.status,
				response: aiError?.responseBody,
			});
			throw aiError;
		}

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
		const safeText = escapeXml(text);
		const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safeText}</Message></Response>`;

		console.log(`[Twilio Webhook] Replying to ${From} with: "${text}"`);

		return new NextResponse(twiml, {
			headers: { "Content-Type": "text/xml" },
		});
	} catch (error: any) {
		const errorDetails = {
			message: error?.message || "Unknown error",
			stack: error?.stack || null,
			name: error?.name || null,
			raw: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : null,
		};
		console.error("[Twilio Webhook] Caught error:", errorDetails);
		return new NextResponse(`
			<Response>
				<Message>Sorry, our system is currently busy. Dimitri will get back to you shortly.</Message>
			</Response>
		`, {
			headers: { "Content-Type": "text/xml" },
		});
	}
}
