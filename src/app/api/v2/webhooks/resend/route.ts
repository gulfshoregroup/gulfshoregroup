import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import UrlMaker from "@/hooks/url-maker";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";
import { recalculateLeadScore } from "@/lib/leads/services/scoring.service";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";

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

interface ExtractedSearch {
	city?: string;
	maxPrice?: number;
	beds?: number;
	baths?: number;
	poolOnly?: boolean;
	waterfrontOnly?: boolean;
}

// Extract search parameters strictly from the user's fresh message (ignoring subject lines with old city names)
function extractSearchParamsFromUserText(text: string): ExtractedSearch {
	const result: ExtractedSearch = {};
	if (!text || typeof text !== "string") return result;

	const clean = text.toLowerCase().trim();

	// 1. City extraction (Strictly from user body text)
	const knownCities = [
		{ key: "sanibel", name: "SANIBEL" },
		{ key: "bonita springs", name: "BONITA SPRINGS" },
		{ key: "bonita", name: "BONITA SPRINGS" },
		{ key: "cape coral", name: "CAPE CORAL" },
		{ key: "fort myers", name: "FORT MYERS" },
		{ key: "ft myers", name: "FORT MYERS" },
		{ key: "ft. myers", name: "FORT MYERS" },
		{ key: "estero", name: "ESTERO" },
		{ key: "marco island", name: "MARCO ISLAND" },
		{ key: "punta gorda", name: "PUNTA GORDA" },
		{ key: "lehigh", name: "LEHIGH ACRES" },
		{ key: "miami", name: "MIAMI" },
		{ key: "ave maria", name: "AVE MARIA" },
		{ key: "naples", name: "NAPLES" },
	];

	for (const item of knownCities) {
		if (clean.includes(item.key)) {
			result.city = item.name;
			break;
		}
	}

	// 2. Max Price extraction ($500k, $1m, 500000, under 1M)
	const priceKMatch = clean.match(/(?:under|below|max|up to|\$)\s*(\d+(?:\.\d+)?)\s*k\b/i);
	if (priceKMatch && priceKMatch[1]) {
		result.maxPrice = parseFloat(priceKMatch[1]) * 1000;
	} else {
		const priceMMatch = clean.match(/(?:under|below|max|up to|\$)\s*(\d+(?:\.\d+)?)\s*m\b/i);
		if (priceMMatch && priceMMatch[1]) {
			result.maxPrice = parseFloat(priceMMatch[1]) * 1000000;
		} else {
			const priceRawMatch = clean.match(/(?:under|below|max|price)\s*\$?(\d[\d,]{3,})/i);
			if (priceRawMatch && priceRawMatch[1]) {
				result.maxPrice = parseInt(priceRawMatch[1].replace(/,/g, ""), 10);
			}
		}
	}

	// 3. Bedrooms extraction (1 bed, 2 beds, 3 bedrooms, 4 bed)
	const bedMatch = clean.match(/(\d+)\s*(?:bed|beds|bedroom|bedrooms)\b/i);
	if (bedMatch && bedMatch[1]) {
		result.beds = parseInt(bedMatch[1], 10);
	}

	// 4. Bathrooms extraction (1 bath, 2 baths, 3 bathrooms)
	const bathMatch = clean.match(/(\d+)\s*(?:bath|baths|bathroom|bathrooms)\b/i);
	if (bathMatch && bathMatch[1]) {
		result.baths = parseInt(bathMatch[1], 10);
	}

	// 5. Pool / Waterfront extraction
	if (clean.includes("pool")) result.poolOnly = true;
	if (clean.includes("waterfront") || clean.includes("gulf access")) result.waterfrontOnly = true;

	return result;
}

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
			<div style="width: 100%; background-color: #f3f4f6; overflow: hidden; text-align: center;">
				<a href="${fullUrl}" target="_blank" style="text-decoration: none; display: block;">
					<img src="${imgUrl}" alt="${p.FullAddress}" width="600" style="width: 100%; max-width: 100%; height: auto; border: 0; display: block; margin: 0 auto;" />
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

		// Support Resend SVIX inbound payload structure (body.data or root body)
		const payloadData = body.data || body;

		const fromEmail = payloadData.From || payloadData.from || payloadData.email || payloadData.sender || body.From || body.from || body.sender || body.headers?.from;
		const textBody = payloadData.TextBody || payloadData.text || payloadData["body-plain"] || payloadData.text_body || payloadData.plain || payloadData.html || payloadData.HtmlBody || payloadData["body-html"] || body.TextBody || body.text || body.html || "";
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

		// Extract clean email address if passed like "User Name <user@example.com>"
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

		// Clean Subject line for Gmail threading: Ensure a single "Re: " prefix
		const rawSub = (rawSubject || "Real Estate Inquiry").trim();
		const hasRe = /^re:\s*/i.test(rawSub);
		const replySubject = hasRe ? rawSub : `Re: ${rawSub}`;

		// Extract ONLY the latest fresh user message from the email (completely strip old thread history)
		const latestUserText = cleanEmailBody(textBody);
		const finalSavedMessage = latestUserText || textBody || `[Warning: Empty Email Body Received]. Payload Keys: ${Object.keys(payloadData).join(", ")}`;

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
				message: `Subject: ${replySubject}\n\n${finalSavedMessage}`,
			}
		});

		// 3. Extract Search Parameters (City, Price, Beds, Baths, Pool) STRICTLY from user's fresh message
		const searchParams = extractSearchParamsFromUserText(latestUserText);
		const freshTextLower = latestUserText.toLowerCase();

		const isSellIntent = freshTextLower.includes("sell") || freshTextLower.includes("selling") || freshTextLower.includes("valuation") || freshTextLower.includes("cma");
		const isBuyIntent = freshTextLower.includes("buy") || freshTextLower.includes("buying") || freshTextLower.includes("property") || freshTextLower.includes("properties") || freshTextLower.includes("home") || freshTextLower.includes("listing") || searchParams.city !== undefined;

		// 4. Query Database for Active Properties matching the extracted criteria (default to NAPLES if no city in user message)
		const targetCity = searchParams.city || "NAPLES";
		console.log(`[Resend Webhook DB Query] Extracted Search Params:`, JSON.stringify(searchParams), `Target City: "${targetCity}"`);

		const dbWhere: any = {
			StandardStatus: "Active",
			City: { contains: targetCity }
		};

		if (searchParams.maxPrice) {
			dbWhere.ListPrice = { lte: searchParams.maxPrice };
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

		// Generate Smart AI Reply
		const aiPrompt = `
${AI_SYSTEM_PROMPT}

You are replying to an email inquiry. 
USER EMAIL MESSAGE: "${latestUserText}"
INTENT DETECTED: ${isSellIntent ? "Selling" : "Buying"}
PROPERTIES FOUND IN DATABASE TO SEND TO USER: ${properties.length} properties.

Write a polite, professional, and concise email reply to the user. 
- Acknowledge their message.
- If properties were found, mention that you have attached some active properties matching their criteria below.
- If no properties were found, apologize and offer to set up a custom alert.
- NEVER mention any listing agents.
- Sign off as "Dimitri Schwarz & AI Concierge Team, Gulfshore Group Real Estate".
`;

		const aiResponse = await generateText({
			model: openai("gpt-4o-mini"),
			prompt: aiPrompt,
		});

		let plainTextSummary = aiResponse.text;
		let htmlContent = "";

		if (isSellIntent && !isBuyIntent) {
			htmlContent = buildHtmlPropertyEmail(
				targetCity,
				properties,
				"COMPLIMENTARY HOME VALUATION & SELLER SERVICES",
				plainTextSummary.replace(/\n/g, "<br>")
			);
		} else {
			htmlContent = buildHtmlPropertyEmail(
				targetCity,
				properties,
				`ACTIVE HOMES MATCHING YOUR SEARCH`,
				plainTextSummary.replace(/\n/g, "<br>")
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
		} catch (sendErr) {
			console.error("[Resend Email Send Exception]:", sendErr);
		}

		return NextResponse.json({ success: true, leadId: lead.id });
	} catch (error: any) {
		console.error("Resend Webhook Error:", error);
		return NextResponse.json({ error: error.message || "Webhook failed" }, { status: 500 });
	}
}
