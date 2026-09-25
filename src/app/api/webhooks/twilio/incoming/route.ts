import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
	try {
		// Twilio sends data as form-urlencoded
		const formData = await req.formData();
		const fromPhoneRaw = formData.get("From")?.toString();
		const bodyText = formData.get("Body")?.toString()?.trim();
		const messageSid = formData.get("MessageSid")?.toString();

		if (!fromPhoneRaw || !bodyText) {
			return NextResponse.json({ error: "Missing required Twilio fields" }, { status: 400 });
		}

		console.log(`[Twilio Webhook] Incoming SMS from ${fromPhoneRaw}: "${bodyText}"`);

		// Clean up the phone number (remove +1 if US, keep digits)
		const cleanPhone = fromPhoneRaw.replace(/\D/g, "");
		let lead = await prisma.lead.findFirst({
			where: {
				phone: {
					contains: cleanPhone.substring(cleanPhone.length - 10) // match last 10 digits
				}
			}
		});

		let leadId = lead?.id;
		
		// If lead doesn't exist, create an anonymous one just to track the chat
		if (!lead) {
			console.log(`[Twilio Webhook] Lead not found for phone ${fromPhoneRaw}. Creating anonymous lead.`);
			lead = await prisma.lead.create({
				data: {
					phone: fromPhoneRaw,
					firstName: "Unknown",
					lastName: "SMS User",
					source: "Incoming SMS",
					status: "New",
					lastContactedAt: new Date()
				}
			});
			leadId = lead.id;
		}

		// 1. Save user's incoming message to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: leadId!,
				channel: "sms",
				role: "user",
				message: bodyText,
			}
		});

		// 2. Fetch previous chat history for context (last 10 messages)
		const previousChats = await prisma.aIChatHistory.findMany({
			where: { leadId: leadId! },
			orderBy: { createdAt: "desc" },
			take: 10,
		});

		// Format history for OpenAI
		const messages = previousChats.reverse().map((c: any) => ({
			role: c.role === "admin" ? "assistant" : c.role, // treat admin manual messages as assistant context too
			content: c.message,
		}));

		// Append the new user message (since previousChats might already include it, let's make sure we don't duplicate. Wait, previousChats includes it because it was just saved! Let's slice it or not push again. Wait, previousChats ALREADY has the newly created message because we created it before querying!)
		// So we do NOT append it again.
		
		const openaiMessages = previousChats.reverse().map((c: any) => ({
			role: c.role === "admin" ? "assistant" : c.role,
			content: c.message,
		}));

		// 3. Generate AI Reply
		console.log(`[Twilio Webhook] Generating AI reply for Lead ${leadId}...`);
		const result = await generateText({
			model: openai('gpt-4o-mini'),
			system: AI_SYSTEM_PROMPT + "\n\nCRITICAL: Keep your response short and suitable for an SMS text message (under 320 characters if possible). Do not use markdown formatting like asterisks or bolding, as SMS doesn't support it.",
			messages: openaiMessages as any,
		});

		const aiResponse = result.text.trim();
		console.log(`[Twilio Webhook] AI Generated Reply: "${aiResponse}"`);

		// 4. Send the AI's reply back to the user via Twilio
		await sendSMS(fromPhoneRaw, aiResponse);

		// 5. Save the AI's reply to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: leadId!,
				channel: "sms",
				role: "ai",
				message: aiResponse,
			}
		});

		// 6. Update lead's last contacted timestamp
		await prisma.lead.update({
			where: { id: leadId! },
			data: { lastContactedAt: new Date() }
		});

		// Return empty TwiML response (200 OK) so Twilio knows we received it
		return new NextResponse("<?xml version=\"1.0\" encoding=\"UTF-8\"?><Response></Response>", {
			status: 200,
			headers: { "Content-Type": "text/xml" }
		});

	} catch (error: any) {
		console.error("Twilio Incoming Webhook Error:", error);
		return NextResponse.json({ error: error.message || "Webhook failed" }, { status: 500 });
	}
}
