import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

// Initialize with a fallback for build time, actual key is used at runtime
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		
		// Resend sends webhooks for inbound emails
		// The exact schema depends on how inbound routing is configured in Resend.
		// Usually, the payload contains: { From, To, TextBody, HtmlBody, Subject }
		
		const fromEmail = body.From || body.from;
		const textBody = body.TextBody || body.text || "";
		const subject = body.Subject || body.subject || "Re: Real Estate Inquiry";

		if (!fromEmail || !textBody) {
			return NextResponse.json({ error: "Missing data" }, { status: 400 });
		}

		// 1. Find lead by email
		let lead = await prisma.lead.findUnique({
			where: { email: fromEmail }
		});

		if (!lead) {
			// If not a known lead, just ignore or create one
			lead = await prisma.lead.create({
				data: {
					email: fromEmail,
					source: "Other",
				}
			});
		}

		// 2. Save user message to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "email",
				role: "user",
				message: `Subject: ${subject}\n\n${textBody}`,
			}
		});

		// 3. Fetch past conversation history
		const pastChats = await prisma.aIChatHistory.findMany({
			where: { leadId: lead.id, channel: "email" },
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
You are replying to a lead via Email. Write a professional, polite, and helpful email reply.
Ask qualifying questions if appropriate. Keep it concise but professional. Sign off as "Dimitri's AI Assistant, Gulfshore Group".`,
			messages,
		});

		// 5. Save AI response to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "email",
				role: "ai",
				message: text,
			}
		});

		// 6. Send the email back via Resend
		await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>",
			to: fromEmail,
			subject: `Re: ${subject.replace("Re: ", "")}`,
			text: text,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Resend Webhook Error:", error);
		return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
	}
}
