import { openai } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import UrlMaker from "@/hooks/url-maker";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";
import { requireLead } from "@/lib/api/auth";
import { recalculateLeadScore } from "@/lib/leads/services/scoring.service";


export const maxDuration = 60; // Allow up to 60 seconds

export async function POST(req: Request) {
	try {
		const { messages } = await req.json();
		const lead = await requireLead();

		// Save the user's incoming message to DB
		const lastUserMessage = messages[messages.length - 1];
		if (lastUserMessage && lastUserMessage.role === "user") {
			let messageText = "";

			if (typeof lastUserMessage.content === "string") {
				messageText = lastUserMessage.content;
			} else if (Array.isArray(lastUserMessage.content)) {
				// Sometimes content is an array of parts
				messageText = lastUserMessage.content.map((p: any) => p.text || "").join("");
			}

			if (!messageText && lastUserMessage.parts && Array.isArray(lastUserMessage.parts)) {
				messageText = lastUserMessage.parts.map((p: any) => p.text || "").join("");
			}

			await prisma.aIChatHistory.create({
				data: {
					leadId: lead.id,
					channel: "website",
					role: "user",
					message: messageText,
				}
			});
		}

		// If guest user, bypass history memory to avoid context/Naples pollution from other guest users
		let activeMessages = messages;
		if (lead.email === "guest@gulfshoregroup.com") {
			// Find the last few user messages to preserve the immediate context of the current search
			// We take the last 10 messages to keep the user's choices (intent, beds, city, budget) active
			activeMessages = messages.slice(-10);
		}

		// @ts-ignore
		const result = streamText({
			model: openai("gpt-4o-mini"),
			// @ts-ignore
			maxSteps: 5,
			system: `You are an expert AI Real Estate Concierge for Gulfshore Group, working on behalf of Dimitri Schwarz. 

CRITICAL: If the user provides a budget, location (e.g., Naples, Bonita Springs), street address, or property requirements (beds, baths, etc.) at ANY point in their message, you MUST immediately call the 'searchProperties' tool with those parameters. 
Do NOT ask qualifying questions, greet them conversationally, or confirm the criteria before running the tool. Run the search first! Presenting properties immediately is the absolute highest priority.

Only ask qualifying questions (1. Budget? 2. Location? 3. Buy/Sell/Both?) if the user's message does NOT contain any search details (e.g., if they just say "hi" or "help me find a home").

Always be concise. Do not write long paragraphs. 
If the user asks for properties matching specific criteria, ALWAYS use the 'searchProperties' tool to fetch real, live data from the database. Do NOT make up properties.

The property database/tool is the sole source of truth. Never guess or fabricate property information.

For broad property searches:
- use searchProperties
- do not manually repeat every property detail
- allow the UI to render property cards

For questions about a specific property (e.g., HOA fees, pool availability, garage spaces, year built, status):
- use searchProperties before answering
- answer only the specific facts requested using the tool data
- property details returned by the tool may be stated directly in your response text
- the property card may still be rendered by the UI

If a requested field is null, missing, or unavailable:
- clearly state that the information is not specified in the database
- never infer or fabricate it

If multiple properties match a specific address lookup:
- do not guess or pick the first one
- state the candidates and request enough identifying information (e.g., Ln, Dr, Ct, or MLS number) to select the correct property

Never rely on prior chat knowledge for property facts when the property database can be queried.

If they provide a specific address (e.g., "5100 Seagrass"), use the address parameter in the tool. ONLY include the street address in the address parameter, DO NOT include city, state, or zip code in the address parameter.
If the search returns no properties, apologize and say you can set up a custom alert for them.

If the user wants to schedule a property tour, viewing, or appointment, use the 'scheduleTour' tool. Ask for their name, phone or email, and preferred date before calling the tool. After booking, confirm the appointment and tell them Dimitri will reach out to confirm.`,
			messages: await convertToModelMessages(activeMessages),
			tools: {
				// @ts-ignore
				searchProperties: tool({
					description: "Search the real estate database for active properties matching the user's criteria. Use this whenever the user asks to see homes, properties, or listings.",
					inputSchema: z.object({
						city: z.string().optional().describe("City name, e.g., Naples, Bonita Springs, Cape Coral"),
						address: z.string().optional().describe("ONLY the street address (e.g. '622 Sw 52nd St'). DO NOT include city, state, or zip code."),
						propertyType: z.string().optional().describe("Type of property (e.g., 'Single Family', 'Condo', 'Townhouse')"),
						community: z.string().optional().describe("Name of the community or subdivision"),
						subdivision: z.string().optional().describe("Name of the subdivision"),
						mlsNumber: z.string().optional().describe("MLS Number of the listing"),
						minPrice: z.coerce.number().optional().describe("Minimum price in dollars"),
						maxPrice: z.coerce.number().optional().describe("Maximum price in dollars"),
						beds: z.coerce.number().optional().describe("Minimum number of bedrooms"),
						baths: z.coerce.number().optional().describe("Minimum number of bathrooms"),
						hasPool: z.boolean().optional().describe("Whether the property must have a private pool"),
						waterfront: z.boolean().optional().describe("Whether the property must be waterfront"),
						gulfAccess: z.boolean().optional().describe("Whether the property must have gulf access"),
						newConstruction: z.boolean().optional().describe("Whether the property is new construction"),
						zipCode: z.string().optional().describe("Postal/Zip code"),
						garage: z.boolean().optional().describe("Whether the property must have a garage"),
						spa: z.boolean().optional().describe("Whether the property must have a spa"),
						minAcres: z.coerce.number().optional().describe("Minimum lot size in acres"),
						maxAcres: z.coerce.number().optional().describe("Maximum lot size in acres"),
						minYearBuilt: z.coerce.number().optional().describe("Minimum year built"),
						maxYearBuilt: z.coerce.number().optional().describe("Maximum year built"),
						yearBuilt: z.coerce.number().optional().describe("Exact year built (e.g. 2025)"),
						maxHoaFee: z.coerce.number().optional().describe("Maximum HOA fee per month"),
						keyword: z.string().optional().describe("A general keyword to search for (e.g. 'nap', 'lehigh'). Use this if the user's request is vague, misspelled, or just a partial word."),
					}),
					// @ts-ignore
					execute: async (args: any) => {
						let { city, address, propertyType, community, subdivision, mlsNumber, minPrice, maxPrice, beds, baths, hasPool, waterfront, gulfAccess, newConstruction, zipCode, garage, spa, minAcres, maxAcres, minYearBuilt, maxYearBuilt, yearBuilt, maxHoaFee, keyword } = args;

						// Ensure numbers are properly parsed in case the LLM passes them as strings/text (e.g. "2 beds" -> 2)
						const parseNumeric = (val: any) => {
							if (val === undefined || val === null) return undefined;
							const parsed = parseInt(String(val).replace(/[^\d.]/g, ""), 10);
							return isNaN(parsed) ? undefined : parsed;
						};

						const parsedBeds = parseNumeric(beds);
						const parsedBaths = parseNumeric(baths);
						const parsedMinPrice = parseNumeric(minPrice);
						const parsedMaxPrice = parseNumeric(maxPrice);
						const parsedMinAcres = parseNumeric(minAcres);
						const parsedMaxAcres = parseNumeric(maxAcres);
						const parsedMinYear = parseNumeric(minYearBuilt);
						const parsedMaxYear = parseNumeric(maxYearBuilt);
						const parsedYear = parseNumeric(yearBuilt);
						const parsedMaxHoa = parseNumeric(maxHoaFee);

						// Prevent returning top 10 most expensive properties by default if no filters are provided
						const hasFilters = city || address || propertyType || community || subdivision || mlsNumber || zipCode || parsedBeds || parsedBaths || parsedMinPrice || parsedMaxPrice || keyword;
						if (!hasFilters && !hasPool && !waterfront && !gulfAccess && !newConstruction && !garage && !spa) {
							return [];
						}

						// For specific property/address/MLS lookups, do not restrict the search to Active listings.
						const isSpecificLookup = !!(address || mlsNumber);
						const where: any = isSpecificLookup ? {} : { StandardStatus: "Active" };

						let finalCity = city;
						let finalAddress = address;

						// AI sometimes wrongly maps city names or keywords to the `address` field
						if (finalAddress) {
							const addrLower = finalAddress.toLowerCase();
							const hasNumbers = /\d/.test(addrLower);

							// If it's a known city OR it has no numbers (people rarely search addresses without house numbers)
							// we move it to 'keyword' so it searches City, Community, and Address broadly!
							const knownCities = ["naples", "bonita", "cape coral", "lehigh", "fort myers", "miami", "marco island", "estero", "sanibel", "punta gorda", "labelle", "babcock", "ave maria"];

							// Check if the address contains any of the known cities as whole words or exact terms
							const matchesKnownCity = knownCities.some(c => {
								const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
								const regex = new RegExp(`\\b${escaped}\\b`, 'i');
								return regex.test(addrLower);
							});

							if (!hasNumbers || (matchesKnownCity && addrLower.split(" ").length <= 3)) {
								keyword = keyword ? `${keyword} ${finalAddress}` : finalAddress;
								finalAddress = undefined;
							}
						}

						// Handle potential typos in city like "Cape Cora" and convert to uppercase for database match reliability
						if (finalCity) {
							const cityUpper = finalCity.toUpperCase();
							if (cityUpper.includes("CAPE CORA")) {
								where.City = { contains: "CAPE CORAL" };
							} else {
								where.City = { contains: cityUpper };
							}
						}

						if (finalAddress) {
							const words = finalAddress.trim().split(' ').filter(Boolean);
							const houseNumber = words[0];
							const streetName = words.slice(1, 3).join(" ");

							if (houseNumber && /^\d+/.test(houseNumber)) {
								// Match starting with the house number, which is very fast in MySQL
								where.FullAddress = { startsWith: houseNumber };
								if (streetName) {
									const streetNameClean = streetName.replace(/\b(ave|ln|dr|rd|ct|st|pl|ter|cir)\b/gi, "").trim();
									if (streetNameClean) {
										where.AND = where.AND || [];
										where.AND.push({ FullAddress: { contains: streetNameClean } });
									}
								}
							} else {
								// Fallback standard contains lookup
								where.FullAddress = { contains: finalAddress };
							}
						}
						if (propertyType) {
							const pt = propertyType.toLowerCase();

							// If AI sends generic transaction terms as property type, handle them intelligently
							const genericTerms = ["buy", "purchase", "sale", "rent", "lease", "any", "properties", "real estate", "listing", "listings", "both", "either"];
							const isGeneric = genericTerms.some(term => pt === term || pt.includes(term));

							if (isGeneric) {
								if (pt.includes("rent") || pt.includes("lease")) {
									where.PropertyType = { contains: "Lease" };
								} else {
									where.PropertyType = { not: "Residential Lease" };
								}
							} else if (pt.includes('condo') || pt.includes('apartment')) {
								where.AND = where.AND || [];
								where.AND.push({
									OR: [
										{ PropertySubType: { contains: 'Rise' } },
										{ PropertySubType: { contains: 'Condo' } },
										{ PropertyType: { contains: 'Condo' } }
									]
								});
							} else if (pt.includes('single family') || pt.includes('home') || pt.includes('house')) {
								where.AND = where.AND || [];
								where.AND.push({
									OR: [
										{ PropertyType: { contains: 'Single Family' } },
										{ PropertySubType: { contains: 'Single Family' } }
									]
								});
							} else if (pt.includes('townhouse') || pt.includes('villa') || pt.includes('land') || pt.includes('commercial')) {
								where.AND = where.AND || [];
								// for exact matches that are common
								const dbType = pt.includes('townhouse') ? 'Townhouse' :
									pt.includes('villa') ? 'Villa' :
										pt.includes('land') || pt.includes('lot') ? 'Land' : 'Commercial';
								where.AND.push({
									OR: [
										{ PropertyType: { contains: dbType } },
										{ PropertySubType: { contains: dbType } }
									]
								});
							}
						}
						if (community) {
							where.AND = where.AND || [];
							where.AND.push({
								OR: [
									{ Community: { contains: community } },
									{ Development: { contains: community } }
								]
							});
						}
						if (subdivision) where.SubdivisionName = { contains: subdivision };
						if (mlsNumber) where.MLSNumber = { contains: mlsNumber.trim() };
						if (zipCode) where.PostalCode = zipCode;

						// Implement broad keyword search for misspelled or partial words (e.g. 'nap')
						if (keyword) {
							const kw = keyword.trim();
							where.AND = where.AND || [];
							where.AND.push({
								OR: [
									{ City: { contains: kw } },
									{ FullAddress: { contains: kw } },
									{ Community: { contains: kw } },
									{ Development: { contains: kw } },
									{ SubdivisionName: { contains: kw } },
								]
							});
						}
						if (parsedMinPrice || parsedMaxPrice) {
							where.ListPrice = {};
							if (parsedMinPrice) where.ListPrice.gte = parsedMinPrice;
							if (parsedMaxPrice) where.ListPrice.lte = parsedMaxPrice;
						}
						if (parsedBeds) where.BedroomsTotal = { gte: parsedBeds };
						if (parsedBaths) where.BathroomsTotalInteger = { gte: parsedBaths };
						if (parsedMinAcres || parsedMaxAcres) {
							where.LotSizeAcres = {};
							if (parsedMinAcres) where.LotSizeAcres.gte = parsedMinAcres;
							if (parsedMaxAcres) where.LotSizeAcres.lte = parsedMaxAcres;
						}
						if (parsedMinYear || parsedMaxYear || parsedYear) {
							where.YearBuilt = {};
							if (parsedMinYear) where.YearBuilt.gte = parsedMinYear;
							if (parsedMaxYear) where.YearBuilt.lte = parsedMaxYear;
							if (parsedYear) where.YearBuilt.equals = parsedYear;
						}
						if (parsedMaxHoa) where.HOAFee = { lte: parsedMaxHoa };
						if (hasPool === true) where.PoolPrivateYN = true;
						if (waterfront === true) where.WaterfrontYN = true;
						if (gulfAccess === true) where.GulfAccessYN = true;
						if (newConstruction === true) where.NewConstructionYN = true;
						if (garage === true) where.GarageYN = true;
						if (spa === true) where.SpaYN = true;

						console.log("AI searchProperties Connecting to database URL host:", process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : "fallback (hayabusa)");
						console.log("AI searchProperties Final prisma where clause filters:", JSON.stringify(where, null, 2));

						const properties = await prisma.property.findMany({
							where,
							take: 10, // limit to 10 so we don't overwhelm the chat but still give good options
							orderBy: { ListPrice: 'desc' },
							select: {
								id: true,
								FullAddress: true,
								ListPrice: true,
								BedroomsTotal: true,
								BathroomsTotalInteger: true,
								PoolPrivateYN: true,
								LivingArea: true,
								PropertyType: true,
								City: true,
								Community: true,
								MLSNumber: true,
								YearBuilt: true,
								Description: true,
								WaterfrontYN: true,
								GulfAccessYN: true,
								GarageYN: true,
								LotSizeAcres: true,
								HOAFee: true,
								StandardStatus: true,
								GarageSpaces: true,
							}
						});

						return properties.map((p: any) => ({
							address: p.FullAddress,
							price: p.ListPrice ? `$${p.ListPrice.toLocaleString()}` : "Price TBD",
							beds: p.BedroomsTotal,
							baths: p.BathroomsTotalInteger,
							pool: p.PoolPrivateYN ? "Yes" : "No",
							sqft: p.LivingArea,
							type: p.PropertyType,
							yearBuilt: p.YearBuilt,
							description: p.Description,
							waterfront: p.WaterfrontYN ? "Yes" : "No",
							gulfAccess: p.GulfAccessYN ? "Yes" : "No",
							garage: p.GarageYN ? "Yes" : "No",
							lotSizeAcres: p.LotSizeAcres,
							hoaFee: p.HOAFee,
							link: UrlMaker(p.City || "", p.Community || "", p.FullAddress || "", p.MLSNumber || undefined),
							status: p.StandardStatus,
							garageSpaces: p.GarageSpaces ?? 0,
						}));
					},
				}),
				// @ts-ignore
				scheduleTour: tool({
					description: "Schedule a property tour or viewing appointment. Use this when the user wants to see a property, book a showing, or meet with an agent. Always ask for their name and contact info first.",
					inputSchema: z.object({
						name: z.string().describe("The visitor's full name"),
						email: z.string().optional().describe("The visitor's email address"),
						phone: z.string().optional().describe("The visitor's phone number"),
						preferredDate: z.string().optional().describe("Preferred date for the tour (e.g., '2024-12-20' or 'next Saturday')"),
						propertyAddress: z.string().optional().describe("The address of the property they want to tour"),
						message: z.string().optional().describe("Any additional notes or preferences"),
					}),
					// @ts-ignore
					execute: async (args: any) => {
						const { name, email, phone, preferredDate, propertyAddress, message } = args;

						try {
							// Find or create lead
							const leadEmail = email || `${phone?.replace(/[^0-9]/g, "") || Date.now()}@chatbot-lead.com`;
							let lead = await prisma.lead.findFirst({
								where: {
									OR: [
										...(email ? [{ email }] : []),
										...(phone ? [{ phone }] : []),
									],
								},
							});

							if (!lead) {
								const nameParts = name.split(" ");
								lead = await prisma.lead.create({
									data: {
										firstName: nameParts[0] || name,
										lastName: nameParts.slice(1).join(" ") || undefined,
										fullName: name,
										email: leadEmail,
										phone: phone || undefined,
										source: "Tour_Request",
										score: 50,
										scoreLabel: "Hot",
									},
								});
							}

							// Create inquiry record
							await prisma.inquiry.create({
								data: {
									leadId: lead.id,
									type: "Tour_Request",
									message: [
										`Tour Request from AI Chatbot`,
										`Name: ${name}`,
										email ? `Email: ${email}` : null,
										phone ? `Phone: ${phone}` : null,
										preferredDate ? `Preferred Date: ${preferredDate}` : null,
										propertyAddress ? `Property: ${propertyAddress}` : null,
										message ? `Notes: ${message}` : null,
									].filter(Boolean).join("\n"),
								},
							});

							// Send admin alert email
							try {
								await sendAdminLeadAlertEmail({
									action: "inquiry",
									leadName: name,
									leadEmail: leadEmail,
									timestamp: new Date(),
									message: `🏠 Tour Request via AI Chatbot\n\nName: ${name}\n${email ? `Email: ${email}\n` : ""}${phone ? `Phone: ${phone}\n` : ""}${preferredDate ? `Preferred Date: ${preferredDate}\n` : ""}${propertyAddress ? `Property: ${propertyAddress}\n` : ""}${message ? `Notes: ${message}` : ""}`,
								});
							} catch (emailErr) {
								console.error("Failed to send admin alert:", emailErr);
							}

							return {
								success: true,
								message: `Tour request booked successfully! Dimitri Schwarz will reach out to ${name} to confirm the appointment.${preferredDate ? ` Preferred date: ${preferredDate}.` : ""}`,
								leadId: lead.id,
							};
						} catch (err: any) {
							console.error("Schedule Tour Error:", err);
							return {
								success: false,
								message: "I apologize, there was an issue booking your tour. Please call Dimitri directly at 239.992.9119 to schedule your viewing.",
							};
						}
					},
				}),
			},
			onFinish: async ({ text, toolCalls, toolResults }: any) => {
				// Save the AI's response to the DB
				let finalMessage = text;

				// If the AI used a tool, we might want to append that context
				if (toolResults && toolResults.length > 0) {
					const result = toolResults[0] as any;
					// Save the arguments passed to the tool to debug parameters payload
					const toolArgs = toolCalls && toolCalls.length > 0 ? JSON.stringify(toolCalls[0].args) : "{}";
					if (result && result.result && Array.isArray(result.result) && result.result.length > 0) {
						finalMessage += `\n\n[Displayed ${result.result.length} properties] [Args: ${toolArgs}]`;
					} else {
						finalMessage += `\n\n[Searched for properties but found none] [Args: ${toolArgs}]`;
					}
				}

				if (finalMessage) {
					await prisma.aIChatHistory.create({
						data: {
							leadId: lead.id,
							channel: "website",
							role: "ai",
							message: finalMessage,
						}
					});
				}

				// Recalculate score after the chat interaction
				try {
					recalculateLeadScore(lead.id);
				} catch (err) {
					console.error("Scoring recalculation error:", err);
				}
			},
		});

		return result.toUIMessageStreamResponse();
	} catch (error: any) {
		console.error("AI Chat Error:", error);
		return Response.json({ error: "Failed to generate AI response" }, { status: 500 });
	}
}
