import { openai } from "@ai-sdk/openai";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import UrlMaker from "@/hooks/url-maker";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";
import { requireLead } from "@/lib/api/auth";
import { recalculateLeadScore } from "@/lib/leads/services/scoring.service";
import { getContextInjectedPrompt } from "@/lib/ai/prompts";

export const maxDuration = 60; // Allow up to 60 seconds

export async function POST(req: Request) {
	try {
		const bodyData = await req.json();
		
		const reqUrl = new URL(req.url);
		const queryUrl = reqUrl.searchParams.get("url");
		
		const currentUrl = bodyData.currentUrl || queryUrl || "";
		console.log("AI Chat API hit. Received URL:", currentUrl);
		console.log("Body keys:", Object.keys(bodyData));
		
		let { messages, propertyContext } = bodyData;
		const lead = await requireLead();

		// If frontend didn't pass propertyContext, try to fetch it from the URL
		if (!propertyContext && currentUrl) {
			try {
				let pathStr = currentUrl;
				try {
					const urlObj = new URL(currentUrl.startsWith("http") ? currentUrl : `http://localhost${currentUrl}`);
					pathStr = urlObj.pathname;
				} catch(e) {}
				
				const pathSegments = pathStr.split("/").filter(Boolean);
				
				// Ensure it's a property page: /Florida-Real-Estate-Listings/[City]/[Community]/[Address]/[MLS]
				if (pathSegments.length >= 4 && pathSegments[0] === "Florida-Real-Estate-Listings") {
					const mlsNumber = pathSegments[pathSegments.length - 1];
					if (mlsNumber) {
						propertyContext = await prisma.property.findUnique({
							where: { MLSNumber: mlsNumber },
							select: {
								FullAddress: true,
								City: true,
								ListPrice: true,
								BedroomsTotal: true,
								BathroomsTotalInteger: true,
								LivingArea: true,
								PoolPrivateYN: true,
								WaterfrontYN: true,
								HOAFee: true,
								TaxAnnualAmount: true,
								YearBuilt: true
							}
						});
					}
				}
			} catch (e) {
				console.error("Failed to fetch property context from URL MLS:", e);
			}
		}

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
			system: getContextInjectedPrompt(propertyContext, currentUrl),
			messages: await convertToModelMessages(activeMessages),
			tools: {
				// @ts-ignore
				calculateDistance: tool({
					description: "Calculate driving distance and time between two locations (e.g. property to beach, airport, etc.) using Google Maps. You MUST generate a polite text response to the user summarizing the result of this tool (e.g. 'The distance is 5 miles, which takes about 10 minutes by car.'). Do NOT just return the tool result without a conversational text message.",
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
				findNearbyPlaces: tool({
					description: "Search for nearby places like beaches, restaurants, schools, or gyms around a specific location. You MUST generate a polite text response to the user summarizing the top 3 results from this tool.",
					inputSchema: z.object({
						location: z.string().describe("The starting address or location (e.g. 100 Bay Rd, Naples)"),
						query: z.string().describe("The type of place to search for (e.g. 'beaches', 'top schools', 'best restaurants')")
					}),
					// @ts-ignore
					execute: async (args: any) => {
						const { location, query } = args;
						const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
						
						if (!apiKey) return { error: "Google Maps API Key is missing. Cannot search places." };
						
						try {
							const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " near " + location)}&key=${apiKey}`;
							const response = await fetch(searchUrl);
							const data = await response.json();
							
							if (data.status !== "OK") {
								if (data.status === "ZERO_RESULTS") {
									return { message: `No ${query} found near ${location}.` };
								}
								return { error: `Failed to search places: ${data.status}` };
							}
							
							const topResults = data.results.slice(0, 3).map((place: any) => ({
								name: place.name,
								address: place.formatted_address,
								rating: place.rating ? `${place.rating} ⭐` : "No rating",
								open_now: place.opening_hours ? place.opening_hours.open_now : "Unknown"
							}));
							
							return {
								query: `${query} near ${location}`,
								top_results: topResults
							};
						} catch (error: any) {
							return { error: "Error searching places: " + error.message };
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
