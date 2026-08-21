import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import twilio from "twilio";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const getResendClient = () => {
	const key = process.env.RESEND_API_KEY || "re_dummy_key_for_build";
	return new Resend(key);
};

export async function GET() {
	try {
		// Run in background to avoid cron-job.org 30s timeout
		(async () => {
			try {
				const resend = getResendClient();
				// 1. Fetch all active campaigns
				const campaigns = await prisma.dripCampaign.findMany({
					where: { status: "active" },
				});

				if (campaigns.length === 0) {
					console.log("No active campaigns found.");
					return;
				}

				let totalSent = 0;
				const now = new Date();

				for (const campaign of campaigns) {
					let eligibleLeads: any[] = [];

					if (campaign.daysAfterSignup === -1) {
						// 10 minutes mode for testing
						const targetDateEnd = new Date();
						targetDateEnd.setMinutes(now.getMinutes() - 10);
						
						const targetDateStart = new Date();
						targetDateStart.setDate(now.getDate() - 7); // 7 days window to ensure we don't miss anyone if cron fails

						eligibleLeads = await prisma.lead.findMany({
							where: {
								createdAt: {
									gte: targetDateStart,
									lte: targetDateEnd,
								},
							},
						});
					} else if (campaign.daysAfterSignup === 0) {
						// Immediate / Test mode (0 days = signed up recently / last 24h)
						eligibleLeads = await prisma.lead.findMany({
							orderBy: { createdAt: "desc" },
							take: 50,
						});
					} else {
						const targetDateEnd = new Date();
						targetDateEnd.setDate(now.getDate() - campaign.daysAfterSignup);
						
						const targetDateStart = new Date();
						targetDateStart.setDate(now.getDate() - campaign.daysAfterSignup - 30); // 30 day window to catch older leads

						eligibleLeads = await prisma.lead.findMany({
							where: {
								createdAt: {
									gte: targetDateStart,
									lte: targetDateEnd,
								},
							},
						});
					}

					for (const lead of eligibleLeads) {
						// Check if already sent
						const existingLog = await prisma.dripCampaignLog.findUnique({
							where: {
								campaignId_userId: {
									campaignId: campaign.id,
									userId: lead.id,
								},
							},
						});

						if (!existingLog) {
							// We need to send it!
							let sent = false;
							let failed = false;
							
							// Replace variables in message
							const personalizedMessage = campaign.messageTemplate
								.replace(/{{name}}/g, lead.firstName || "there")
								.replace(/{{email}}/g, lead.email || "");

							const isEmail = campaign.channel === "Email" || campaign.channel === "email" || campaign.channel === "Both";
							const isSMS = campaign.channel === "SMS" || campaign.channel === "text" || campaign.channel === "Both";

							if (isEmail && lead.email) {
								try {
									const result = await resend.emails.send({
										from: process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>",
										to: lead.email,
										subject: campaign.name,
										html: `<p>${personalizedMessage.replace(/\\n/g, "<br/>")}</p>`,
									});
									sent = true;
									
									if (result.data?.id) {
										try {
											await prisma.communicationLog.create({
												data: {
													type: "Email",
													to: lead.email,
													subject: campaign.name,
													status: "sent",
													providerId: result.data.id,
												}
											});
										} catch (logErr) {
											console.error("Failed to log drip email:", logErr);
										}
									}
								} catch (e) {
									console.error("Email send failed:", e);
									failed = true;
								}
							} 
							
							if (isSMS && lead.phone) {
								try {
									const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
									const message = await client.messages.create({
										body: personalizedMessage,
										from: process.env.TWILIO_NUMBER,
										to: lead.phone,
									});
									sent = true;
									
									try {
										await prisma.communicationLog.create({
											data: {
												type: "SMS",
												to: lead.phone,
												subject: "Drip Campaign SMS",
												message: personalizedMessage,
												status: "sent",
												providerId: message.sid,
											}
										});
									} catch(logErr) {
										console.error("Failed to log drip sms:", logErr);
									}
								} catch (e) {
									console.error("SMS send failed:", e);
									failed = true;
								}
							}

							// Create log entry regardless of success or failure to prevent infinite retry loops
							await prisma.dripCampaignLog.create({
								data: {
									campaignId: campaign.id,
									userId: lead.id,
									status: sent ? "sent" : "failed",
								},
							});

							if (sent) {
								totalSent++;
							}
						}
					}
				}
				console.log(`[Cron Background] Successfully sent ${totalSent} drip notifications.`);
			} catch (error) {
				console.error("[Cron Background] Drip Cron Error:", error);
			}
		})();

		return NextResponse.json({ success: true, message: "Drip campaign processing started in background." });
	} catch (error: any) {
		console.error("Cron Route Error:", error);
		return NextResponse.json({ success: false, message: error.message }, { status: 500 });
	}
}
