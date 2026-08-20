import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
	try {
		const payload = await req.json();
		console.log("[Email Webhook payload received]:", JSON.stringify(payload, null, 2));

		const data = payload.data || payload;
		const fromEmail = data.from || data.sender || data.From;
		const subject = data.subject || data.Subject || "No Subject";
		let textBody = data.text || data.html || data.TextBody || data.HtmlBody || "";

		// If this is a standard Resend webhook, it might not contain the body. Fetch it using email_id
		if (!textBody && data.email_id) {
			console.log(`[Email Webhook] Text is missing. Fetching full INBOUND email by ID: ${data.email_id}...`);
			try {
				// Inbound emails require the 'receiving' API endpoint in Resend
				let emailResponse;
				if ((resend.emails as any).receiving) {
					emailResponse = await (resend.emails as any).receiving.get(data.email_id);
				} else {
					// Fallback if receiving is not typed but available on raw resend object
					const res = await fetch(`https://api.resend.com/emails/${data.email_id}/receiving`, {
						headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}` }
					});
					emailResponse = { data: await res.json() };
				}
				
				if (emailResponse && emailResponse.data) {
					textBody = emailResponse.data.text || emailResponse.data.html || "";
				}
			} catch (err) {
				console.error("[Email Webhook] Error fetching inbound email body:", err);
			}
		}

		// Extract just the new reply, remove the quoted history (e.g. "On Wed, Jul 29... wrote:")
		const cleanTextBody = textBody
			.split(/On\s+.*?\s+wrote:/i)[0] // Remove Gmail style quotes
			.split(/-----Original Message-----/i)[0] // Remove Outlook style quotes
			.split(/_{5,}/)[0] // Remove Yahoo style quotes
			.split(/From:\s+/i)[0] // Remove iOS style quotes
			.replace(/^>.*$/gm, "") // Remove remaining > quote lines
			.trim();

		console.log(`[Email Webhook Parsed Data] From: ${fromEmail}, Subject: ${subject}, Text length: ${cleanTextBody?.length}`);

		if (!fromEmail || !cleanTextBody) {
			console.error("[Email Webhook Error] Missing fields. Parsed as:", { fromEmail, subject, text: cleanTextBody ? 'Present' : 'Missing' });
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// Clean the email address if it comes in format "Name <email@domain.com>"
		const match = fromEmail.match(/<([^>]+)>/);
		const cleanEmail = match ? match[1] : fromEmail.trim();
		console.log(`[Email Webhook] Clean email: ${cleanEmail}`);

		// Find the lead by email
		let lead = await prisma.lead.findUnique({
			where: { email: cleanEmail },
		});

		// If lead doesn't exist, we can optionally create one (or ignore)
		if (!lead) {
			lead = await prisma.lead.create({
				data: {
					email: cleanEmail,
					firstName: "New",
					lastName: "Lead",
					fullName: "New Lead",
					source: "Inbound Email",
					status: "New",
				},
			});
		}

		// 1. Save User's Email to AI Chat History
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "email",
				role: "user",
				message: `Subject: ${subject}\n\n${cleanTextBody}`,
			}
		});

		// 2. Fetch past context for the AI
		const pastChats = await prisma.aIChatHistory.findMany({
			where: { leadId: lead.id },
			orderBy: { createdAt: 'asc' },
			take: 20
		});

		const formattedHistory = pastChats.map(chat => ({
			role: chat.role === "ai" ? "assistant" : "user",
			content: chat.message
		}));

		// 3. Generate AI Response
		const { text: aiResponse } = await generateText({
			model: openai("gpt-4o-mini"),
			system: `You are an expert AI Real Estate Concierge for Gulfshore Group, working on behalf of Dimitri Schwarz. 
You are replying to an email from a client. Keep your tone highly professional, concise, and helpful. 
Do not use emojis excessively. Format your response exactly like a professional email body (no need for Subject line, just the body). 
Sign off with:
Best regards,
Gulfshore Group AI Concierge
on behalf of Dimitri Schwarz`,
			messages: formattedHistory as any,
		});

		// 4. Send the Email back to the user via Resend
		const adminEmail = process.env.ADMIN_ALERT_EMAIL || "mailbox@gulfshoregroup.com";
		
		await resend.emails.send({
			from: process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>",
			to: cleanEmail,
			subject: `Re: ${subject}`,
			text: aiResponse,
		});

		// 5. Save AI's Reply to AI Chat History
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "email",
				role: "ai",
				message: aiResponse,
			}
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[EmailWebhookError]", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
