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
		const { messages, currentUrl } = await req.json();
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

BUYER VS. SELLER INTENT DETECTION:

1. BUYER INTENT (User wants to BUY, RENT, or FIND listings):
- If the user is looking to buy, rent, or view available homes (e.g., "i want properties in Sanibel", "looking for 3 beds in Naples under 1M"):
- You MUST immediately call the 'searchProperties' tool with all parameters extracted (city, address, price, beds, baths, pool, propertyType).
- CRITICAL: If the user provides ONLY a location (e.g. "i want properties in Sanibel", "properties in location Sanibel", "show homes in Naples"), YOU MUST IMMEDIATELY CALL 'searchProperties' WITH THAT CITY!
- DO NOT ask for budget, bedrooms, bathrooms, or criteria BEFORE running the tool! Run the search FIRST and display the property cards immediately!
- Presenting matching properties immediately is the absolute highest priority for buyers.

STRICT PARAMETER MATCHING INSTRUCTIONS FOR BUYERS:
- Always extract ALL criteria specified by the user in their current message: location (city, community, zip), price/budget (minPrice, maxPrice), street address, bedrooms (beds), bathrooms (baths), property type, pool, waterfront, etc.
- Pass EVERY extracted parameter to the 'searchProperties' tool call so the database filters properties strictly according to the user's exact query.
- DO NOT carry over old or outdated budget/price limits (minPrice/maxPrice) from previous chat history messages when the user enters a new location search (e.g. "i want properties in Sanibel"), UNLESS the user explicitly repeats or mentions the budget in their latest message.
- Never drop or ignore any search criteria provided by the user in their latest message.

2. SELLER & PROPERTY LOOKUP WORKFLOW (User wants to SELL a home, check their listed properties, or list a new property):
- If a user mentions wanting ONLY to sell a property, check their listed properties, or provides an email address (e.g., "i want to sell my property, my email is john@example.com", "check my properties for john@example.com"):
- You MUST call the 'checkSellerProperties' tool with their email address.
- If the tool returns existing properties (found: true), acknowledge their existing listed properties, summarize them briefly, and direct them to click "+ Add New Property to Sell" (linking to /sell) to list another property.
- If the tool returns no properties (found: false), politely inform them that no existing listings were found for that email, and invite them to click "+ Add New Property to Sell" to create a new listing on /sell.
- If the user provides details about a NEW property to sell (address, beds, baths, name, email), call 'scheduleTour' (setting message: "Home Valuation & Seller Listing Request") to record the lead and valuation in the database, and inform them they can also manage full property details & upload photos at /sell.

3. BOTH BUY & SELL INTENT (User wants to BOTH buy and sell):
- If the user mentions wanting to BOTH buy and sell (e.g., "i want to buy and sell both", "looking to sell my home and buy in Naples"):
- You MUST immediately call the 'searchProperties' tool with all extracted location, price/amount, address, beds, baths, or property features so active matching properties to buy are displayed immediately.
- In your text response, acknowledge their goal to sell their current property as well, mention that Dimitri Schwarz provides free Home Valuations & listing services, and invite them to click the "+ Add New Property to Sell" button (linking to /sell) to submit their home for sale.

Only ask qualifying questions (1. Budget? 2. Location? 3. Buy/Sell/Both?) if the user's message does NOT contain any search or selling details (e.g., if they just say "hi" or "help me").

Always be concise. Do not write long paragraphs. 
If the user asks for properties matching specific criteria, ALWAYS use the 'searchProperties' tool to fetch real, live data from the database. Do NOT make up properties.

The property database/tool is the sole source of truth. Never guess or fabricate property information.

For broad property searches:
- use searchProperties
- write only a short 1-sentence intro (e.g. "Here are active listings matching your criteria in Naples:")
- DO NOT manually write out property lists, addresses, prices, bedrooms, or markdown links in text — the UI handles rendering property cards visually!

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

CRITICAL NO-FALLBACK RULE WHEN NO PROPERTIES ARE FOUND (FOR BUYERS):
- If 'searchProperties' returns NO properties (an empty list []), NEVER call 'searchProperties' a second time with relaxed parameters or removed location filters. Accept that 0 properties exist for that search.
- NEVER present fallback properties from Naples or other Florida cities if the user requested a specific location (such as "India", "New York", "California", etc.) or criteria that returned no matches.
- If no properties are found for the user's requested location or criteria:
  1. Apologize politely and state clearly that no matching listings were found in our database for that location/criteria.
  2. Explain that Gulfshore Group specializes exclusively in Southwest Florida real estate (including Naples, Bonita Springs, Cape Coral, Fort Myers, Estero, Marco Island, Sanibel, etc.).
  3. Offer to set up a custom property alert for them or help them search within Southwest Florida.

If the user wants to schedule a property tour, viewing, home valuation, or appointment, use the 'scheduleTour' tool. Ask for their name, phone or email, and preferred date before calling the tool. After booking, confirm the appointment and tell them Dimitri will reach out to confirm.
		
${currentUrl ? `\nCRITICAL CONTEXT: The user is currently viewing the following URL on the website: ${currentUrl}\nIf the user refers to "this", "this property", "here", or asks a question about distance without specifying an origin address, they are talking about the property located at ${currentUrl}. You should extract the address from the URL (e.g. from /Florida-Real-Estate-Listings/Cape-Coral/Community/123-Main-St/MLS) and use it for tools like 'calculateDistance'.` : ""}`,
			messages: await convertToModelMessages(activeMessages),
			tools: {
				// @ts-ignore
				calculateDistance: tool({
					description: "Calculate driving distance and time between two locations (e.g. property to beach, airport, etc.) using Google Maps.",
					inputSchema: z.object({
						origin: z.string().describe("The starting address or location"),
						destination: z.string().describe("The ending address or location")
					}),
					// @ts-ignore
					execute: async (args: any) => {
						const { origin, destination } = args;
						const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
						
						if (!apiKey) return { error: "Google Maps API Key is missing. Cannot calculate distance." };
						
						try {
							const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&key=${apiKey}`;
							const response = await fetch(url);
							const data = await response.json();
							
							if (data.status !== "OK") {
								return { error: `Failed to calculate distance: ${data.status}` };
							}
							
							const element = data.rows[0].elements[0];
							if (element.status !== "OK") {
								return { error: `No route found between ${origin} and ${destination}.` };
							}
							
							return {
								origin_address: data.origin_addresses[0],
								destination_address: data.destination_addresses[0],
								distance_miles: element.distance.text,
								duration_traffic: element.duration.text
							};
						} catch (error: any) {
							return { error: "Error calculating distance: " + error.message };
						}
					}
				}),
				// @ts-ignore
				checkSellerProperties: tool({
					description: "Look up a seller's existing property listings or home valuation requests by their email address, and provide an option/link to add a new property for sale on /sell.",
					inputSchema: z.object({
						email: z.string().describe("The seller's email address to search"),
					}),
					// @ts-ignore
					execute: async (args: any) => {
						const { email } = args;
						if (!email || !email.includes("@")) {
							return {
								found: false,
								email: email || "",
								message: "Please provide a valid email address to look up your seller property listings.",
								addPropertyUrl: "/sell"
							};
						}

						const cleanEmail = email.toLowerCase().trim();
						const lead = await prisma.lead.findUnique({
							where: { email: cleanEmail },
							include: {
								inquiryHistory: {
									orderBy: { createdAt: "desc" }
								}
							}
						});

						if (!lead || !lead.inquiryHistory || lead.inquiryHistory.length === 0) {
							return {
								found: false,
								email: cleanEmail,
								message: `No existing property listings or valuation requests were found for ${cleanEmail}.`,
								addPropertyUrl: "/sell"
							};
						}

						const sellerInquiries = lead.inquiryHistory;

						const properties = sellerInquiries.map((inq: any) => {
							let addr = "Property Valuation / Listing Request";
							if (inq.message) {
								const match = inq.message.match(/Property Address:\s*([^\n]+)/i) ||
									inq.message.match(/Property:\s*([^\n]+)/i) ||
									inq.message.match(/Address:\s*([^\n]+)/i);
								if (match && match[1]) {
									addr = match[1].trim();
								}
							}
							return {
								id: inq.id,
								type: inq.type,
								address: addr,
								message: inq.message,
								createdAt: inq.createdAt
							};
						});

						return {
							found: true,
							email: cleanEmail,
							leadName: lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
							properties,
							addPropertyUrl: "/sell"
						};
					},
				}),
				// @ts-ignore
				searchProperties: tool({
					description: "Search the real estate database for active properties matching the user's criteria. Use this whenever the user asks to see homes, properties, or listings.",
					inputSchema: z.object({
						city: z.string().optional().describe("City name only (e.g., Sanibel, Naples, Bonita Springs, Cape Coral). DO NOT include state, 'FL', or 'location'."),
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

						// Normalize location strings by stripping state codes (FL, Florida), filler words (location, area, city), and punctuation
						const cleanLocation = (val: any): string | undefined => {
							if (!val || typeof val !== "string") return undefined;
							const cleaned = val
								.replace(/,\s*fl\b/gi, "")
								.replace(/,\s*florida\b/gi, "")
								.replace(/\bfl\b/gi, "")
								.replace(/\bflorida\b/gi, "")
								.replace(/\blocation\b/gi, "")
								.replace(/\barea\b/gi, "")
								.replace(/\bcity\b/gi, "")
								.replace(/[,;]/g, " ")
								.replace(/\s+/g, " ")
								.trim();
							return cleaned || undefined;
						};

						let finalCity = cleanLocation(city);
						let finalAddress = address ? address.trim() : undefined;
						keyword = cleanLocation(keyword);
						community = cleanLocation(community);
						subdivision = cleanLocation(subdivision);

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
								keyword = keyword ? `${keyword} ${cleanLocation(finalAddress) || finalAddress}` : (cleanLocation(finalAddress) || finalAddress);
								finalAddress = undefined;
							}
						}

						// Handle potential typos in city like "Cape Cora" and convert to uppercase for database match reliability
						if (finalCity) {
							const cityUpper = finalCity.toUpperCase();
							if (cityUpper.includes("CAPE CORA")) {
								where.City = { contains: "CAPE CORAL" };
							} else if (cityUpper.includes("FT MYERS") || cityUpper.includes("FT. MYERS")) {
								where.City = { contains: "FORT MYERS" };
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
							// Only add keyword filter if keyword is distinct from finalCity to avoid excluding addresses
							if (!finalCity || kw.toLowerCase() !== finalCity.toLowerCase()) {
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

						const selectFields = {
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
						};

						let properties = await prisma.property.findMany({
							where,
							take: 10, // limit to 10 so we don't overwhelm the chat but still give good options
							orderBy: { ListPrice: 'desc' },
							select: selectFields
						});

						// Smart Fallback: If strict price filter returned 0 results, retry without ListPrice constraint to show active location listings
						if (properties.length === 0 && where.ListPrice) {
							const fallbackWhere = { ...where };
							delete fallbackWhere.ListPrice;

							const fallbackProperties = await prisma.property.findMany({
								where: fallbackWhere,
								take: 10,
								orderBy: { ListPrice: 'asc' }, // Show lowest priced available listings first
								select: selectFields
							});

							if (fallbackProperties.length > 0) {
								properties = fallbackProperties;
							}
						}

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

				if (toolResults && toolResults.length > 0) {
					const resultObj = toolResults[0] as any;
					// Fallback to resultObj.args if toolCalls is not populated in onFinish
					const rawArgs = (toolCalls && toolCalls.length > 0) ? toolCalls[0].args : resultObj.args;
					const toolArgs = rawArgs ? JSON.stringify(rawArgs) : "{}";
					
					// AI SDK sometimes returns the array directly in resultObj.result, or it might be serialized.
					const toolRet = resultObj.result;
					const count = Array.isArray(toolRet) ? toolRet.length : (toolRet && typeof toolRet === 'object' && toolRet.properties ? toolRet.properties.length : 0);

					if (count > 0) {
						finalMessage += `\n\n[Displayed ${count} properties] [Args: ${toolArgs}]`;
					} else if (toolRet && toolRet.found === true) {
						// For seller check
						finalMessage += `\n\n[Found Seller Properties] [Args: ${toolArgs}]`;
					} else if (toolRet && toolRet.success === true) {
						// For schedule tour
						finalMessage += `\n\n[Scheduled Tour/Valuation] [Args: ${toolArgs}]`;
					} else {
						finalMessage += `\n\n[Searched but found none or returned empty] [Args: ${toolArgs}]`;
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
