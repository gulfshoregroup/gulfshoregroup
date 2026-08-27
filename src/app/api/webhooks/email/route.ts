import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import UrlMaker from "@/hooks/url-maker";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";
import { recalculateLeadScore } from "@/lib/leads/services/scoring.service";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://gulfshoregroup.com";

// Helper to extract best cover image URL for property cards
function getPropertyImageUrl(p: any): string {
	if (p.media && Array.isArray(p.media) && p.media.length > 0 && p.media[0]?.MediaURL) {
		return p.media[0].MediaURL;
	}
	if (p.images) {
		if (Array.isArray(p.images) && p.images.length > 0) {
			const first = p.images[0];
			if (typeof first === "string") return first;
			if (typeof first === "object" && first?.MediaURL) return first.MediaURL;
		}
	}
	// High-resolution luxury real estate fallback photo
	return "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80";
}

// Robust Helper to extract ONLY the user's latest fresh email message (completely strip quoted thread history)
const cleanEmailBody = (rawBody: string): string => {
	if (!rawBody || typeof rawBody !== "string") return "";

	// 1. Aggressively strip Gmail/Outlook quote containers before HTML tag removal
	let cleanedRaw = rawBody
		.replace(/<div\s+class=["']gmail_quote["']>[\s\S]*$/gi, "")
		.replace(/<blockquote[\s\S]*$/gi, "");

	// 2. Cut off at "On <date> ... wrote:" header anywhere in the string
	const quoteMatch = cleanedRaw.match(/\bOn\s+[\s\S]*?wrote\s*:/i);
	if (quoteMatch && quoteMatch.index !== undefined) {
		cleanedRaw = cleanedRaw.substring(0, quoteMatch.index);
	}

	const origMatch = cleanedRaw.match(/-----Original Message-----/i);
	if (origMatch && origMatch.index !== undefined) {
		cleanedRaw = cleanedRaw.substring(0, origMatch.index);
	}

	// 3. Strip HTML tags and convert <br>/<p> to line breaks
	let text = cleanedRaw
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n\n")
		.replace(/<[^>]+>/g, "");

	const lines = text.split("\n");
	const userLines: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (
			/^On\s+.*wrote:/i.test(trimmed) ||
			/^On\s+.*wrote\s*:/i.test(trimmed) ||
			/^-----Original Message-----/i.test(trimmed) ||
			/^From:\s+.*<.*>/i.test(trimmed) ||
			/^Sent:\s+/i.test(trimmed)
		) {
			break;
		}
		if (trimmed.startsWith(">")) {
			continue;
		}
		userLines.push(line);
	}

	const result = userLines.join(" ").replace(/\s+/g, " ").trim();
	return result || rawBody.replace(/<[^>]+>/g, "").trim();
};

// Remove the old Regex extraction function
// We will use OpenAI's generateObject directly in the POST route instead.

// Builder for High-End Luxury Property Email Template (Matches User Reference Image)
function buildHtmlPropertyEmail(
	matchedCity: string,
	properties: any[],
	introTitle: string = "HOMES MATCHING YOUR SEARCH",
	subtitle: string = "We found matching active properties for your criteria."
): string {
	const propertyCardsHtml = properties.map((p: any) => {
		const relativeUrl = UrlMaker(p.City || "", p.Community || "", p.FullAddress || "", p.MLSNumber || undefined);
		const fullUrl = `${baseUrl}${relativeUrl}`;
		const imgUrl = getPropertyImageUrl(p);
		const formattedPrice = p.ListPrice ? `$${p.ListPrice.toLocaleString()}` : "Price Upon Request";
		const beds = p.BedroomsTotal ?? 0;
		const baths = p.BathroomsTotalInteger ?? 0;
		const sqft = p.LivingArea ? `${p.LivingArea.toLocaleString()} sqft` : "N/A";
		const poolText = p.PoolPrivateYN ? "Private Pool" : p.WaterfrontYN ? "Waterfront" : "Luxury Residence";
		const officeName = p.ListOfficeName || "Gulfshore Group Real Estate";

		return `
		<!-- PROPERTY CARD -->
		<div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
			<!-- COVER IMAGE -->
			<div style="width: 100%; height: 220px; background-color: #f3f4f6; overflow: hidden;">
				<a href="${fullUrl}" target="_blank" style="text-decoration: none;">
					<img src="${imgUrl}" alt="${p.FullAddress}" style="width: 100%; height: 220px; object-fit: cover; border: 0; display: block;" />
				</a>
			</div>

			<!-- CARD BODY -->
			<div style="padding: 18px 20px;">
				<!-- ACTIVE BADGE -->
				<div style="margin-bottom: 8px;">
					<span style="background-color: #16a34a; color: #ffffff; font-size: 10px; font-weight: 800; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px; text-transform: uppercase;">ACTIVE</span>
				</div>

				<!-- PRICE -->
				<div style="font-size: 26px; font-weight: 800; color: #111827; margin: 4px 0 2px 0; letter-spacing: -0.5px;">
					${formattedPrice}
				</div>

				<!-- ADDRESS -->
				<div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 4px;">
					${p.FullAddress}, ${p.City}, FL ${p.PostalCode || ""}
				</div>

				<!-- SUBTYPE / COMMUNITY -->
				<div style="font-size: 11px; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
					${(p.PropertyType || "SINGLE FAMILY").toUpperCase()} ${p.Community ? `• ${p.Community.toUpperCase()}` : ""}
				</div>

				<!-- SPECS GRID -->
				<div style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 10px 0; margin-bottom: 14px;">
					<table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; color: #4b5563; text-align: center;">
						<tr>
							<td width="25%" style="border-right: 1px solid #f3f4f6;"><strong>${beds}</strong> Beds</td>
							<td width="25%" style="border-right: 1px solid #f3f4f6;"><strong>${baths}</strong> Baths</td>
							<td width="25%" style="border-right: 1px solid #f3f4f6;"><strong>${sqft}</strong></td>
							<td width="25%"><strong>${poolText}</strong></td>
						</tr>
					</table>
				</div>

				<!-- LISTING OFFICE -->
				<div style="font-size: 11px; color: #9ca3af; margin-bottom: 14px;">
					Source: MLS Listing • Listing Office: ${officeName}
				</div>

				<!-- RED VIEW DETAILS BUTTON -->
				<a href="${fullUrl}" target="_blank" style="display: block; width: 100%; background-color: #dc2626; color: #ffffff; text-align: center; padding: 13px 0; border-radius: 6px; font-size: 14px; font-weight: 700; text-decoration: none; box-sizing: border-box;">
					VIEW DETAILS
				</a>
			</div>
		</div>
		`;
	}).join("");

	return `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
	</head>
	<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
		<div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
			
			<!-- HEADER LOGO BAR -->
			<div style="padding: 24px 24px 16px 24px; border-bottom: 2px solid #dc2626; background-color: #ffffff; text-align: center;">
				<h1 style="margin: 0; color: #dc2626; font-size: 24px; font-weight: 900; letter-spacing: -0.5px;">GULFSHORE GROUP</h1>
				<p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Real Estate Concierge | Dimitri Schwarz</p>
			</div>

			<!-- INTRO SECTION -->
			<div style="padding: 24px 24px 12px 24px; text-align: center; background-color: #ffffff;">
				<h2 style="margin: 0 0 8px 0; color: #111827; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${introTitle} IN ${matchedCity}</h2>
				<p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${subtitle}</p>
				<div style="width: 60px; height: 3px; background-color: #d97706; margin: 16px auto 0 auto; border-radius: 2px;"></div>
			</div>

			<!-- CARDS CONTAINER -->
			<div style="padding: 16px 24px 24px 24px; background-color: #f9fafb;">
				${propertyCardsHtml}
			</div>

			<!-- FOOTER -->
			<div style="padding: 20px 24px; background-color: #ffffff; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
				<p style="margin: 0 0 8px 0; font-weight: 600;">Dimitri Schwarz & AI Concierge Team • Gulfshore Group Real Estate</p>
				<p style="margin: 0 0 8px 0;">Looking to sell your home or get a free valuation? <a href="${baseUrl}/sell" style="color: #dc2626; font-weight: bold; text-decoration: underline;">Visit Seller Portal</a></p>
				<p style="margin: 0; color: #9ca3af;">© ${new Date().getFullYear()} Gulfshore Group. All rights reserved. <a href="${baseUrl}" style="color: #dc2626; text-decoration: none;">www.gulfshoregroup.com</a></p>
			</div>

		</div>
	</body>
	</html>
	`;
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		console.log("[Resend Webhook Payload Received]:", JSON.stringify(body));

		// If this is a status update event (sent, delivered, bounced, complained, opened, clicked)
		if (body.type && body.type.startsWith("email.") && body.type !== "email.received") {
			const eventData = body.data || body;
			const emailId = eventData.email_id || eventData.id;
			
			if (emailId) {
				const status = body.type.split(".")[1] || "unknown";
				try {
					await prisma.communicationLog.updateMany({
						where: { providerId: emailId },
						data: { status: status, updatedAt: new Date() }
					});
					console.log(`[Resend Webhook] Updated log ${emailId} to status: ${status}`);
				} catch (err) {
					console.error("Failed to update communication log status:", err);
				}
			}
			return NextResponse.json({ success: true, event: body.type });
		}

		// Support Resend SVIX inbound payload structure (body.data or root body)
		const payloadData = body.data || body;

		const fromEmail = payloadData.From || payloadData.from || payloadData.email || body.From || body.from || body.headers?.from;
		const textBody = payloadData.TextBody || payloadData.text || payloadData.html || body.TextBody || body.text || body.html || "";
		const rawSubject = payloadData.Subject || payloadData.subject || body.Subject || body.subject || "Real Estate Inquiry";

		// Robust Extraction of Message-ID for email threading (In-Reply-To / References)
		let messageId: string | undefined = undefined;

		if (payloadData.headers) {
			if (Array.isArray(payloadData.headers)) {
				const found = payloadData.headers.find((h: any) => h.name?.toLowerCase() === "message-id");
				if (found) messageId = found.value;
			} else if (typeof payloadData.headers === "object") {
				messageId = payloadData.headers["message-id"] || payloadData.headers["Message-ID"] || payloadData.headers["message_id"] || payloadData.headers["Message-Id"];
			}
		}

		if (!messageId) {
			messageId = payloadData.email_id || payloadData.id || body.email_id || body.id;
		}

		// Clean up the fromEmail address
		let cleanFromEmail = fromEmail || "";
		const emailMatch = cleanFromEmail.match(/<([^>]+)>/);
		if (emailMatch && emailMatch[1]) {
			cleanFromEmail = emailMatch[1].trim();
		} else {
			cleanFromEmail = cleanFromEmail.trim();
		}

		if (!cleanFromEmail) {
			return NextResponse.json({ error: "Missing sender email address" }, { status: 400 });
		}

		// LOOP PREVENTION: Ignore automated emails, bounces, and our own emails
		const lowerEmail = cleanFromEmail.toLowerCase();
		if (
			lowerEmail.includes("noreply") || 
			lowerEmail.includes("no-reply") || 
			lowerEmail.includes("mailer-daemon") || 
			lowerEmail.includes("postmaster") || 
			lowerEmail.includes("bounce") ||
			lowerEmail.includes("@updates.gulfshoregroup.com")
		) {
			console.log(`[Loop Prevention] Ignored automated sender: ${cleanFromEmail}`);
			return NextResponse.json({ success: true, ignored: true, reason: "automated_sender" });
		}

		// LOOP PREVENTION: Check headers for auto-replies (Out of Office)
		const headers = payloadData.headers || body.headers || {};
		const headerString = typeof headers === 'object' ? JSON.stringify(headers).toLowerCase() : String(headers).toLowerCase();
		
		if (
			headerString.includes('"auto-submitted":"auto-replied"') || 
			headerString.includes('"auto-submitted":"auto-generated"') ||
			headerString.includes('"x-autoreply":"yes"') ||
			headerString.includes('"precedence":"bulk"') ||
			headerString.includes('"precedence":"auto_reply"')
		) {
			console.log(`[Loop Prevention] Ignored auto-responder from: ${cleanFromEmail}`);
			return NextResponse.json({ success: true, ignored: true, reason: "auto_responder_headers" });
		}

		// Clean Subject line for Gmail threading: Ensure a single "Re: " prefix
		const rawSub = (rawSubject || "Real Estate Inquiry").trim();
		const hasRe = /^re:\s*/i.test(rawSub);
		const replySubject = hasRe ? rawSub : `Re: ${rawSub}`;

		// Extract ONLY the latest fresh user message from the email (completely strip old thread history)
		const latestUserText = cleanEmailBody(textBody);
		console.log(`[Resend Webhook Processed] Sender: ${cleanFromEmail} | Reply Subject: "${replySubject}" | Latest Fresh Text: "${latestUserText}" | Msg ID: "${messageId}"`);

		// 1. Find or create lead by email
		let lead = await prisma.lead.findUnique({
			where: { email: cleanFromEmail }
		});

		if (!lead) {
			lead = await prisma.lead.create({
				data: {
					email: cleanFromEmail,
					source: "Other",
				}
			});
		}

		// 2. Save ONLY the new user message to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "email",
				role: "user",
				message: `Subject: ${replySubject}\n\n${latestUserText || textBody}`,
			}
		});

		// 3. Use OpenAI to Extract Intent and Search Parameters smartly from the user's fresh message
		let searchParams: any = {};
		let isBuyIntent = false;
		let isSellIntent = false;
		let generatedReplyText = "";
		
		try {
			const aiResult = await generateObject({
				model: openai("gpt-4o-mini"),
				schema: z.object({
					intent: z.enum(["buy", "sell", "both", "general"]).describe("The core intent of the user. Are they looking to buy, sell, both, or just asking a general question?"),
					city: z.string().optional().describe("The city the user wants to search in (e.g., Naples, Cape Coral, Fort Myers, Bonita Springs, Sanibel). Return uppercase."),
					minPrice: z.number().optional().describe("Minimum price in dollars (e.g. 500000)"),
					maxPrice: z.number().optional().describe("Maximum price in dollars (e.g. 1000000)"),
					beds: z.number().optional().describe("Minimum number of bedrooms"),
					baths: z.number().optional().describe("Minimum number of bathrooms"),
					poolOnly: z.boolean().optional().describe("Does the user specifically want a pool?"),
					waterfrontOnly: z.boolean().optional().describe("Does the user specifically want waterfront or gulf access?"),
					replyText: z.string().describe("A polite, 2-sentence conversational reply to the user's email addressing their query, which will be included at the top of the HTML email.")
				}),
				prompt: `Analyze the following email from a real estate lead and extract their intent, search criteria, and generate a polite reply.
				
				Email Context:
				Subject: ${replySubject}
				Message: ${latestUserText}`
			});
			
			const aiData = aiResult.object;
			
			searchParams = {
				city: aiData.city,
				minPrice: aiData.minPrice,
				maxPrice: aiData.maxPrice,
				beds: aiData.beds,
				baths: aiData.baths,
				poolOnly: aiData.poolOnly,
				waterfrontOnly: aiData.waterfrontOnly
			};
			
			isBuyIntent = aiData.intent === "buy" || aiData.intent === "both";
			isSellIntent = aiData.intent === "sell" || aiData.intent === "both";
			generatedReplyText = aiData.replyText;
			
			console.log("[OpenAI Intent Extraction] Success:", JSON.stringify(aiData));
		} catch (aiErr) {
			console.error("[OpenAI Intent Extraction] Failed, falling back to defaults:", aiErr);
			generatedReplyText = "Thank you for reaching out to Gulfshore Group!";
			isBuyIntent = true;
		}

		// 4. Query Database for Active Properties matching the extracted criteria (default to NAPLES if no city in user message)
		const targetCity = searchParams.city || "NAPLES";
		console.log(`[Resend Webhook DB Query] Extracted Search Params:`, JSON.stringify(searchParams), `Target City: "${targetCity}"`);

		const dbWhere: any = {
			StandardStatus: "Active",
			City: { contains: targetCity }
		};

		if (searchParams.minPrice) {
			dbWhere.ListPrice = { ...dbWhere.ListPrice, gte: searchParams.minPrice };
		}
		if (searchParams.maxPrice) {
			dbWhere.ListPrice = { ...dbWhere.ListPrice, lte: searchParams.maxPrice };
		}
		if (searchParams.beds) {
			dbWhere.BedroomsTotal = { gte: searchParams.beds };
		}
		if (searchParams.baths) {
			dbWhere.BathroomsTotalInteger = { gte: searchParams.baths };
		}
		if (searchParams.poolOnly) {
			dbWhere.PoolPrivateYN = true;
		}
		if (searchParams.waterfrontOnly) {
			dbWhere.WaterfrontYN = true;
		}

		let properties = await prisma.property.findMany({
			where: dbWhere,
			take: 6,
			orderBy: { ListPrice: 'desc' },
			select: {
				id: true,
				FullAddress: true,
				ListPrice: true,
				BedroomsTotal: true,
				BathroomsTotalInteger: true,
				LivingArea: true,
				PropertyType: true,
				PropertySubType: true,
				City: true,
				StateOrProvince: true,
				PostalCode: true,
				Community: true,
				MLSNumber: true,
				PoolPrivateYN: true,
				WaterfrontYN: true,
				GulfAccessYN: true,
				ListOfficeName: true,
				images: true,
				media: {
					take: 1,
					select: { MediaURL: true }
				}
			}
		});

		// Fallback to general city search if strict filters returned 0 results
		if (properties.length === 0) {
			properties = await prisma.property.findMany({
				where: {
					City: { contains: targetCity },
					StandardStatus: "Active"
				},
				take: 6,
				orderBy: { ListPrice: 'desc' },
				select: {
					id: true,
					FullAddress: true,
					ListPrice: true,
					BedroomsTotal: true,
					BathroomsTotalInteger: true,
					LivingArea: true,
					PropertyType: true,
					PropertySubType: true,
					City: true,
					StateOrProvince: true,
					PostalCode: true,
					Community: true,
					MLSNumber: true,
					PoolPrivateYN: true,
					WaterfrontYN: true,
					GulfAccessYN: true,
					ListOfficeName: true,
					images: true,
					media: {
						take: 1,
						select: { MediaURL: true }
					}
				}
			});
		}

		console.log(`[Resend Webhook DB Query] Found ${properties.length} active properties in ${targetCity}`);

		let plainTextSummary = "";
		let htmlContent = "";

		if (isSellIntent && !isBuyIntent) {
			// SELLER INTENT
			plainTextSummary = `Hello,

${generatedReplyText}

Dimitri Schwarz provides complimentary, high-precision Home Valuations (Comparative Market Analysis) and full listing representation across Southwest Florida.

To list your property for sale or get a free home market valuation immediately, please visit our seller portal:
${baseUrl}/sell

Best regards,
Dimitri Schwarz & AI Team
Gulfshore Group Real Estate
${baseUrl}`;

			htmlContent = buildHtmlPropertyEmail(
				targetCity,
				properties,
				"COMPLIMENTARY HOME VALUATION & SELLER SERVICES",
				`${generatedReplyText}<br><br>Dimitri Schwarz offers full listing representation. Visit <a href="${baseUrl}/sell" style="color: #dc2626; font-weight: bold;">Seller Portal</a> to list your home. Here are active market listings in ${targetCity} for reference:`
			);
		} else {
			// BUY INTENT or GENERAL PROPERTY SEARCH
			plainTextSummary = `Hello,

${generatedReplyText}

Here are top active property listings currently available in ${targetCity}:

${properties.map((p, i) => `${i + 1}. ${p.FullAddress} - $${p.ListPrice?.toLocaleString()} (${baseUrl}${UrlMaker(p.City || "", p.Community || "", p.FullAddress || "", p.MLSNumber || undefined)})`).join("\n")}

Best regards,
Dimitri Schwarz & AI Team
Gulfshore Group Real Estate
${baseUrl}`;

			htmlContent = buildHtmlPropertyEmail(
				targetCity,
				properties,
				`ACTIVE HOMES MATCHING YOUR SEARCH`,
				`${generatedReplyText}<br><br>We found ${properties.length} active luxury properties matching your search criteria in ${targetCity}. Each listing has been curated for quality and value.`
			);
		}

		console.log(`[Resend Webhook Success] Generated luxury email card HTML response for ${targetCity}.`);

		// 6. Save response to AIChatHistory
		await prisma.aIChatHistory.create({
			data: {
				leadId: lead.id,
				channel: "email",
				role: "ai",
				message: plainTextSummary,
			}
		});

		// Recalculate lead score
		try {
			recalculateLeadScore(lead.id);
		} catch (scoreErr) {
			console.error("Scoring error:", scoreErr);
		}

		// 7. Build email thread headers so Gmail stacks replies in the SAME thread (Only if valid RFC Message-ID containing @)
		const sendHeaders: Record<string, string> = {};
		if (messageId && messageId.includes("@")) {
			const formattedMsgId = messageId.startsWith("<") && messageId.endsWith(">") ? messageId : `<${messageId}>`;
			sendHeaders["In-Reply-To"] = formattedMsgId;
			sendHeaders["References"] = formattedMsgId;
		}

		// 8. Send the luxury email card response back via Resend inside the SAME thread
		try {
			const sendResult = await resend.emails.send({
				from: process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>",
				to: cleanFromEmail,
				subject: replySubject,
				text: plainTextSummary,
				html: htmlContent,
				headers: Object.keys(sendHeaders).length > 0 ? sendHeaders : undefined,
			});
			console.log("[Resend Email Sent Result]:", JSON.stringify(sendResult));
			
			if (sendResult?.data?.id) {
				try {
					await prisma.communicationLog.create({
						data: {
							type: "Email",
							to: cleanFromEmail,
							subject: replySubject,
							status: "sent",
							providerId: sendResult.data.id,
						},
					});
				} catch (logErr) {
					console.error("Failed to log AI auto reply:", logErr);
				}
			}
		} catch (sendErr) {
			console.error("[Resend Email Send Exception]:", sendErr);
		}

		return NextResponse.json({ success: true, leadId: lead.id });
	} catch (error: any) {
		console.error("Resend Webhook Error:", error);
		return NextResponse.json({ error: error.message || "Webhook failed" }, { status: 500 });
	}
}
