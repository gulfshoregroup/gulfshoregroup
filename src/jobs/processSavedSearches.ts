import prisma from "@/lib/prisma";
import { sendSMS } from "@/lib/twilio";
import { buildQueryFromFilters } from "@/lib/search-filters";
import { sendPropertyAlert } from "@/lib/leads/services/property-alerts";

/**
 * Checks for new properties matching saved searches and sends SMS/Email alerts.
 * Also sends a generic "Top New Listing" daily blast to all other leads.
 */
export async function processSavedSearches() {
	console.log("[SavedSearch] Starting to process saved searches & generic alerts...");

	try {
		// Keep track of leads who received personalized alerts so we don't double-email them
		const alertedLeadIds = new Set<string>();

		// ---------------------------------------------------------
		// 1. PERSONALIZED ALERTS (Saved Searches)
		// ---------------------------------------------------------
		const activeSearches = await prisma.savedSearch.findMany({
			where: { notify: true },
			include: { user: true },
		});

		// Group searches by user
		const searchesByUser = new Map<string, { lead: any, searches: any[] }>();
		for (const search of activeSearches) {
			const lead = search.user;
			if (!lead) continue;
			if (!searchesByUser.has(lead.id)) {
				searchesByUser.set(lead.id, { lead, searches: [] });
			}
			searchesByUser.get(lead.id)!.searches.push(search);
		}

		for (const [userId, { lead, searches }] of searchesByUser.entries()) {
			const allMatchingProperties = new Map<string, any>();
			const searchesToUpdate = [];

			for (const search of searches) {
				// Look back 24 hours if never checked
				const lookbackDate = search.lastNotifiedAt
					? search.lastNotifiedAt
					: new Date(Date.now() - 24 * 60 * 60 * 1000);

				const filtersObj = search.filters as any;
				const searchParams = buildQueryFromFilters(filtersObj || {});
				
				// Build proper Prisma where clause from searchParams
				const baseWhere: any = {};
				
				// Price Range
				const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
				const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
				if (minPrice !== null || maxPrice !== null) {
					baseWhere.ListPrice = {};
					if (minPrice !== null) baseWhere.ListPrice.gte = minPrice;
					if (maxPrice !== null) baseWhere.ListPrice.lte = maxPrice;
				}
				
				// Locations
				if (filtersObj.city) baseWhere.City = { contains: filtersObj.city.replace(/-/g, ' ') };
				if (filtersObj.postalCode) baseWhere.PostalCode = filtersObj.postalCode;
				if (filtersObj.mls || filtersObj.MLSNumber) baseWhere.MLSNumber = filtersObj.mls || filtersObj.MLSNumber;
				if (filtersObj.subdivision) baseWhere.Development = { contains: filtersObj.subdivision };
				if (filtersObj.developmentName) baseWhere.Community = { contains: filtersObj.developmentName.replace(/-/g, ' ') };
				
				// Beds / Baths
				const bedsParam = searchParams.get("beds");
				if (bedsParam) baseWhere.BedroomsTotal = { gte: parseInt(bedsParam) };
				const bathsParam = searchParams.get("baths");
				if (bathsParam) baseWhere.BathroomsFull = { gte: parseInt(bathsParam) };
				
				// Acres
				const minAcres = searchParams.get("minAcres") ? parseFloat(searchParams.get("minAcres")!) : null;
				const maxAcres = searchParams.get("maxAcres") ? parseFloat(searchParams.get("maxAcres")!) : null;
				if (minAcres !== null || maxAcres !== null) {
					baseWhere.LotSizeAcres = {};
					if (minAcres !== null) baseWhere.LotSizeAcres.gte = minAcres;
					if (maxAcres !== null) baseWhere.LotSizeAcres.lte = maxAcres;
				}
				
				// Year Built
				const builtYearMin = searchParams.get("builtYearMin") ? parseInt(searchParams.get("builtYearMin")!) : null;
				const builtYearMax = searchParams.get("builtYearMax") ? parseInt(searchParams.get("builtYearMax")!) : null;
				if (builtYearMin !== null || builtYearMax !== null) {
					baseWhere.YearBuilt = {};
					if (builtYearMin !== null) baseWhere.YearBuilt.gte = builtYearMin;
					if (builtYearMax !== null) baseWhere.YearBuilt.lte = builtYearMax;
				}
				
				// Bounding Box
				if (filtersObj.north && filtersObj.south && filtersObj.east && filtersObj.west) {
					baseWhere.AND = [
						{ Latitude: { gte: parseFloat(String(filtersObj.south)), lte: parseFloat(String(filtersObj.north)) } },
						{ Longitude: { gte: parseFloat(String(filtersObj.west)), lte: parseFloat(String(filtersObj.east)) } },
					];
				}

				// Features
				const featuresRaw = searchParams.get("features") || "";
				const features = featuresRaw ? featuresRaw.split(",").map((f: string) => f.trim().toLowerCase()) : searchParams.getAll("features[]").map((f: string) => f.toLowerCase());
				if (features.length > 0) {
					if (features.some((f: string) => f.includes("spa"))) baseWhere.SpaYN = true;
					if (features.some((f: string) => f.includes("waterfront"))) baseWhere.WaterfrontYN = true;
					if (features.some((f: string) => f.includes("pool"))) baseWhere.PoolPrivateYN = true;
					if (features.some((f: string) => f.includes("gulf"))) baseWhere.GulfAccessYN = true;
					if (features.some((f: string) => f.includes("garage"))) baseWhere.GarageYN = true;
				}
				if (searchParams.get("hoa") === "yes") baseWhere.WaterfrontYN = { not: null };
				
				// Property Types
				const types = searchParams.get("propertyTypes") ? searchParams.get("propertyTypes")!.split(",") : [];
				if (types.length > 0) {
					const orConditions: any[] = [];
					if (types.includes("Homes") || types.includes("homes") || types.includes("Single Family")) {
						orConditions.push({ PropertySubType: "Single Family Residence" });
					}
					if (types.includes("Condos") || types.includes("condos")) {
						orConditions.push({ PropertySubType: { in: ["Low Rise (1-3)", "Mid Rise (4-7)", "High Rise (8+)", "Townhouse"] } });
					}
					if (types.includes("Lots") || types.includes("Residential-Lots") || types.includes("lots")) {
						orConditions.push({ PropertyType: "Land" });
					}
					if (orConditions.length > 0) {
						baseWhere.OR = orConditions;
					}
					baseWhere.PropertyType = { not: "Residential Lease" };
				} else {
					baseWhere.PropertyType = { notIn: ["Residential Lease", "Land"] };
				}

				const finalWhere = {
					...baseWhere,
					StandardStatus: "Active",
					createdAt: { gt: lookbackDate },
					// Prevent spam from bulk historical imports by ensuring the property is actually new to the market
					OR: [
						{ DaysOnMarket: { lte: 14 } },
						{ OnMarketDate: { gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }
					]
				};

				const matchingProperties = await prisma.property.findMany({
					where: finalWhere,
				});

				if (matchingProperties.length > 0) {
					searchesToUpdate.push(search.id);
					for (const prop of matchingProperties) {
						allMatchingProperties.set(prop.id, prop);
					}
				}
			}

			// If this user has matches across any of their searches, send exactly one aggregated alert.
			if (allMatchingProperties.size > 0) {
				const count = allMatchingProperties.size;
				const propertiesArray = Array.from(allMatchingProperties.values());

				// FORMAT SMS
				const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SITE_URL || "https://gulfshoregroup.com";
				const domain = baseUrl.replace(/^https?:\/\//, '');
				const smsMessage = `Dimitri Schwarz 239.992.9119 ${domain} - You have ${count} New Listing${count > 1 ? 's' : ''} matching your saved searches.`;

				// SEND SMS
				if (lead.phone) {
					console.log(`[SavedSearch] Matches found for Lead ${lead.email}. Sending SMS.`);
					await sendSMS(lead.phone, smsMessage).catch(err => console.error("SMS Error:", err));
				}

				// SEND EMAIL
				if (lead.email) {
					console.log(`[SavedSearch] Sending Email to ${lead.email}.`);
					await sendPropertyAlert({
						to: lead.email,
						recipientName: lead.firstName || "Valued Client",
						leadId: lead.id,
						subject: `Dimitri Schwarz 239.992.9119 | ${count} New Property Match${count > 1 ? 'es' : ''} for Your Saved Searches`,
						alertTitle: "New Homes Matching Your Searches",
						alertSubtitle: `We found ${count} new propert${count > 1 ? 'ies' : 'y'} that match your saved preferences across all your searches.`,
						properties: propertiesArray as any,
					}).catch(err => console.error("Email Error:", err));
				}
			}

			alertedLeadIds.add(lead.id);

			// Update lastNotifiedAt for all the searches that produced matches
			await prisma.savedSearch.updateMany({
				where: { id: { in: searchesToUpdate } },
				data: { lastNotifiedAt: new Date() },
			});
		}

		// ---------------------------------------------------------
		// 2. GENERIC BLAST TO ALL OTHER LEADS (Once a day at ~10 AM EDT / 14:00 UTC)
		// ---------------------------------------------------------
		const currentUTCHour = new Date().getUTCHours();
		const isDailyBlastHour = currentUTCHour === 12; // 8 AM EDT 
		
		// If it's the daily blast hour, send to everyone else
		if (isDailyBlastHour) {
			console.log("[SavedSearch] Running Daily Generic Blast for all other leads...");
			
			// Find the absolute newest active property from the last 24 hours
			const newestProperty = await prisma.property.findFirst({
				where: { 
					StandardStatus: "Active",
					createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
					OR: [
						{ DaysOnMarket: { lte: 14 } },
						{ OnMarketDate: { gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } }
					]
				},
				orderBy: { createdAt: 'desc' }
			});

			if (newestProperty) {
				const allLeads = await prisma.lead.findMany({
					where: {
						id: { notIn: Array.from(alertedLeadIds) }, // Skip leads who already got a personalized alert today
					}
				});

				for (const lead of allLeads) {
					// SEND SMS (Generic)
					if (lead.phone) {
						let priceStr = newestProperty.ListPrice ? `$${newestProperty.ListPrice.toLocaleString()}` : "";
						const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SITE_URL || "https://gulfshoregroup.com";
						const domain = baseUrl.replace(/^https?:\/\//, '');
						const smsMessage = `Dimitri Schwarz 239.992.9119 ${domain} - Featured New Listing in ${newestProperty.City} ${priceStr}`;
						await sendSMS(lead.phone, smsMessage).catch(err => console.error("SMS Error:", err));
					}

					// SEND EMAIL (Generic)
					if (lead.email) {
						await sendPropertyAlert({
							to: lead.email,
							recipientName: lead.firstName || "Valued Client",
							leadId: lead.id,
							subject: `Dimitri Schwarz 239.992.9119 | Featured New Listing in ${newestProperty.City}`,
							alertTitle: "A Naples Area Home for You",
							alertSubtitle: `Here is a brand new listing we think you'll love.`,
							properties: newestProperty as any,
						}).catch(err => console.error("Email Error:", err));
					}
				}
				console.log(`[SavedSearch] Sent generic daily blast to ${allLeads.length} leads.`);
			} else {
				console.log("[SavedSearch] No new properties in the last 24h for the generic blast.");
			}
		}

		console.log("[SavedSearch] Finished processing saved searches and alerts.");
	} catch (error) {
		console.error("[SavedSearch] Error processing searches:", error);
	}
}
