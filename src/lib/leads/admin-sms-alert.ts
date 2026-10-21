import { sendSMS } from "@/lib/twilio";
import prisma from "@/lib/prisma";

interface IncomingSmsNotificationParams {
	fromPhone: string;
	messageBody: string;
	lead?: {
		id?: string;
		firstName?: string | null;
		lastName?: string | null;
		phone?: string | null;
		email?: string | null;
	} | null;
}

/**
 * Notifies the Admin / Agent (Dimitri) via SMS and Email whenever an incoming
 * text message is received from a lead on the Twilio business number.
 */
export async function notifyAdminOnIncomingSms({
	fromPhone,
	messageBody,
	lead,
}: IncomingSmsNotificationParams): Promise<void> {
	const adminPhone = process.env.LEAD_SMS_ALERT_PHONE || process.env.PROPERTY_ALERT_PHONE;
	const adminEmail = process.env.LEAD_SMS_ALERT_EMAIL || process.env.ADMIN_ALERT_EMAIL || "mailbox@gulfshoregroup.com";

	const leadDisplayName = lead
		? `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || lead.phone || fromPhone
		: fromPhone;

	const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://gulfshoregroup.com";
	const adminDashboardUrl = `${serverUrl.replace(/\/$/, "")}/admin/leads`;

	// 1. Send SMS Alert to Admin phone (e.g. +12399929119)
	if (adminPhone) {
		const adminSmsText = `🚨 New SMS from Lead!\nFrom: ${leadDisplayName} (${fromPhone})\nMessage: "${messageBody}"\n\n👉 Open Admin to reply: ${adminDashboardUrl}`;
		try {
			await sendSMS(adminPhone, adminSmsText);
			console.log(`[Twilio Webhook Alert] Admin SMS alert sent successfully to ${adminPhone}`);
		} catch (smsErr) {
			console.error("[Twilio Webhook Alert] Failed to send admin SMS alert:", smsErr);
		}
	} else {
		console.warn("[Twilio Webhook Alert] No LEAD_SMS_ALERT_PHONE or PROPERTY_ALERT_PHONE configured in .env");
	}

	// 2. Send Email Alert to Admin via Resend
	if (process.env.RESEND_API_KEY && adminEmail) {
		try {
			const { Resend } = await import("resend");
			const resend = new Resend(process.env.RESEND_API_KEY);
			const fromEmail = process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>";
			const escapedBody = messageBody.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

			await resend.emails.send({
				from: fromEmail,
				to: [adminEmail],
				subject: `🚨 [SMS Lead Reply] New message from ${leadDisplayName} (${fromPhone})`,
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
						<div style="border-bottom: 2px solid #B89A6A; padding-bottom: 12px; margin-bottom: 20px;">
							<h2 style="color: #111827; margin: 0; font-size: 20px;">New SMS Received from Lead</h2>
							<p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">A user has texted your Twilio business number.</p>
						</div>

						<div style="background-color: #f9fafb; border-left: 4px solid #B89A6A; padding: 16px; margin: 20px 0; border-radius: 4px;">
							<p style="margin: 0 0 8px 0; font-size: 14px; color: #374151;"><strong>Lead:</strong> ${leadDisplayName}</p>
							<p style="margin: 0 0 12px 0; font-size: 14px; color: #374151;"><strong>Phone:</strong> <a href="tel:${fromPhone}" style="color: #B89A6A; text-decoration: none;">${fromPhone}</a></p>
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
			console.log(`[Twilio Webhook Alert] Admin Email alert sent successfully to ${adminEmail}`);
		} catch (emailErr) {
			console.error("[Twilio Webhook Alert] Failed to send admin Email alert:", emailErr);
		}
	}
}
