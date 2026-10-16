import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { aiTools } from "@/lib/ai/tools";

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
					email: `sms_${cleanPhone || Date.now()}@incoming.gulfshoregroup.com`,
					firstName: "SMS",
					lastName: "Lead",
					source: "General",
					status: "New",
					lastContactedAt: new Date()
				}
			});
			leadId = lead.id;
		}

		// Notify Admin via both SMS and Email immediately
		// Uses dedicated lead reply alert keys if set, with automatic fallback to general alert env vars
		const adminPhone = process.env.LEAD_SMS_ALERT_PHONE || process.env.PROPERTY_ALERT_PHONE;
		const adminEmail = process.env.LEAD_SMS_ALERT_EMAIL || process.env.ADMIN_ALERT_EMAIL || "mailbox@gulfshoregroup.com";
		const leadDisplayName = lead
			? `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.phone || fromPhoneRaw
			: fromPhoneRaw;
		const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://gulfshoregroup.com";
		const adminDashboardUrl = `${serverUrl.replace(/\/$/, "")}/admin/leads`;

		// 1. Send SMS Alert to Admin
		if (adminPhone) {
			const adminSmsText = `🚨 New SMS from Lead!\nFrom: ${leadDisplayName} (${fromPhoneRaw})\nMessage: "${bodyText}"\n\n👉 Open Admin to reply: ${adminDashboardUrl}`;
			try {
				await sendSMS(adminPhone, adminSmsText);
				console.log(`[Twilio Webhook] Admin SMS alert sent to ${adminPhone}`);
			} catch (smsErr) {
				console.error("[Twilio Webhook] Failed to send admin SMS alert:", smsErr);
			}
		}

		// 2. Send Email Alert to Admin via Resend
		if (process.env.RESEND_API_KEY && adminEmail) {
			try {
				const { Resend } = await import("resend");
				const resend = new Resend(process.env.RESEND_API_KEY);
				const fromEmail = process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>";
				const escapedBody = bodyText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

				await resend.emails.send({
					from: fromEmail,
					to: [adminEmail],
					subject: `🚨 [SMS Lead Reply] New message from ${leadDisplayName} (${fromPhoneRaw})`,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
							<div style="border-bottom: 2px solid #B89A6A; padding-bottom: 12px; margin-bottom: 20px;">
								<h2 style="color: #111827; margin: 0; font-size: 20px;">New SMS Received from Lead</h2>
								<p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">A user has texted your Twilio business number.</p>
							</div>

							<div style="background-color: #f9fafb; border-left: 4px solid #B89A6A; padding: 16px; margin: 20px 0; border-radius: 4px;">
								<p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Lead:</strong> ${leadDisplayName}</p>
								<p style="margin: 0 0 12px 0; font-size: 14px; color: #374151;"><strong>Phone:</strong> <a href="tel:${fromPhoneRaw}" style="color: #B89A6A; text-decoration: none;">${fromPhoneRaw}</a></p>
								<p style="margin: 0 0 6px 0; font-size: 13px; font-weight: bold; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">Message Text:</p>
								<div style="font-size: 15px; color: #111827; background: #ffffff; padding: 12px 14px; border-radius: 6px; border: 1px solid #e5e7eb; line-height: 1.5;">
									"${escapedBody}"
								</div>
							</div>

							<div style="margin: 28px 0 16px 0; text-align: center;">
								<a href="${adminDashboardUrl}" style="background-color: #B89A6A; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
									Open Admin Dashboard to Reply
								</a>
							</div>

							<p style="font-size: 12px; color: #9ca3af; margin-top: 24px; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 14px;">
								Gulfshore Group Real Estate CRM · Automated Notification
							</p>
						</div>
					`,
				});
				console.log(`[Twilio Webhook] Admin Email alert sent to ${adminEmail}`);
			} catch (emailErr) {
				console.error("[Twilio Webhook] Failed to send admin Email alert:", emailErr);
			}
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

		// Reverse to chronological order for OpenAI
		previousChats.reverse();

		// Format history for OpenAI (admin/ai -> assistant, user -> user)
		const openaiMessages = previousChats.map((c: any) => ({
			role: c.role === "admin" || c.role === "ai" ? "assistant" : "user",
			content: c.message,
		}));

		// 3. Generate AI Reply
		console.log(`[Twilio Webhook] Generating AI reply for Lead ${leadId}...`);
		const result = await generateText({
			model: openai('gpt-4o-mini'),
			stopWhen: stepCountIs(5),
			tools: aiTools,
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
