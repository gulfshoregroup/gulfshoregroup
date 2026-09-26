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
		const activeSearches = await prisma.savedSearch.findMany({
			where: { notify: true },
			include: { user: true },
		});

		// Group searches by user
		const searchesByUser = new Map<string, { lead: any; searches: any[] }>();
		for (const search of activeSearches) {
			const lead = search.user;
			if (!lead) continue;
			if (!searchesByUser.has(lead.id)) {
				searchesByUser.set(lead.id, { lead, searches: [] });
			}
			searchesByUser.get(lead.id)!.searches.push(search);
		}

		const parseNum = (val: any): number | null => {
			if (val === null || val === undefined || val === "") return null;
			const n = Number(val);
			return isNaN(n) ? null : n;
		};

		for (const [userId, { lead, searches }] of searchesByUser.entries()) {
			// Wrap each user processing in an inner try-catch so one broken search never halts the entire job
			try {
				const allMatchingProperties = new Map<string, any>();
				const processedSearchIds: string[] = [];

				for (const search of searches) {
					processedSearchIds.push(search.id);

					// Look back 24 hours if never checked
					const lookbackDate = search.lastNotifiedAt
						? search.lastNotifiedAt
						: new Date(Date.now() - 24 * 60 * 60 * 1000);

					const filtersObj = search.filters as any;
					const searchParams = buildQueryFromFilters(filtersObj || {});

					const baseWhere: any = {};

					// Price Range
					const minPrice = parseNum(searchParams.get("minPrice") || filtersObj?.minPrice);
					const maxPrice = parseNum(searchParams.get("maxPrice") || filtersObj?.maxPrice);
					if (minPrice !== null || maxPrice !== null) {
						baseWhere.ListPrice = {};
						if (minPrice !== null) baseWhere.ListPrice.gte = minPrice;
						if (maxPrice !== null) baseWhere.ListPrice.lte = maxPrice;
					}

					// Locations
					if (filtersObj.city) baseWhere.City = { contains: filtersObj.city.replace(/-/g, " ") };
					if (filtersObj.postalCode) baseWhere.PostalCode = String(filtersObj.postalCode);
					if (filtersObj.mls || filtersObj.MLSNumber) baseWhere.MLSNumber = String(filtersObj.mls || filtersObj.MLSNumber);
					if (filtersObj.subdivision) baseWhere.Development = { contains: String(filtersObj.subdivision) };
					if (filtersObj.developmentName) baseWhere.Community = { contains: String(filtersObj.developmentName).replace(/-/g, " ") };

					// Beds / Baths
					const bedsParam = parseNum(searchParams.get("beds") || filtersObj?.beds);
					if (bedsParam !== null) baseWhere.BedroomsTotal = { gte: Math.floor(bedsParam) };
					const bathsParam = parseNum(searchParams.get("baths") || filtersObj?.baths);
					if (bathsParam !== null) baseWhere.BathroomsFull = { gte: Math.floor(bathsParam) };

					// Acres
					const minAcres = parseNum(searchParams.get("minAcres") || filtersObj?.minAcres);
					const maxAcres = parseNum(searchParams.get("maxAcres") || filtersObj?.maxAcres);
					if (minAcres !== null || maxAcres !== null) {
						baseWhere.LotSizeAcres = {};
						if (minAcres !== null) baseWhere.LotSizeAcres.gte = minAcres;
						if (maxAcres !== null) baseWhere.LotSizeAcres.lte = maxAcres;
					}

					// Year Built
					const builtYearMin = parseNum(searchParams.get("builtYearMin") || filtersObj?.builtYearMin);
					const builtYearMax = parseNum(searchParams.get("builtYearMax") || filtersObj?.builtYearMax);
					if (builtYearMin !== null || builtYearMax !== null) {
						baseWhere.YearBuilt = {};
						if (builtYearMin !== null) baseWhere.YearBuilt.gte = Math.floor(builtYearMin);
						if (builtYearMax !== null) baseWhere.YearBuilt.lte = Math.floor(builtYearMax);
					}

					// Bounding Box
					const south = parseNum(filtersObj.south);
					const north = parseNum(filtersObj.north);
					const west = parseNum(filtersObj.west);
					const east = parseNum(filtersObj.east);
					if (south !== null && north !== null && west !== null && east !== null) {
						baseWhere.AND = [
							{ Latitude: { gte: south, lte: north } },
							{ Longitude: { gte: west, lte: east } },
						];
					}

					// Features
					const featuresRaw = searchParams.get("features") || "";
					const features = featuresRaw
						? featuresRaw.split(",").map((f: string) => f.trim().toLowerCase())
						: searchParams.getAll("features[]").map((f: string) => f.toLowerCase());
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
						baseWhere.NOT = { PropertyType: { contains: "Lease" } };
					} else {
						baseWhere.PropertyType = { not: "Land" };
						baseWhere.NOT = { PropertyType: { contains: "Lease" } };
					}

					const finalWhere = {
						...baseWhere,
						StandardStatus: "Active",
						OR: [
							{ ModificationTimestamp: { gt: lookbackDate } },
							{ BridgeModificationTimestamp: { gt: lookbackDate } },
							{ OnMarketDate: { gt: lookbackDate } },
						],
					};

					const matchingProperties = await prisma.property.findMany({
						where: finalWhere,
						take: 50,
						orderBy: { updatedAt: "desc" },
					});

					if (matchingProperties.length > 0) {
						for (const prop of matchingProperties) {
							allMatchingProperties.set(prop.id, prop);
						}
					}
				}

				// Send aggregated alert if user has matches across any of their searches
				if (allMatchingProperties.size > 0) {
					const count = allMatchingProperties.size;
					const propertiesArray = Array.from(allMatchingProperties.values());

					// FORMAT SMS
					const rawBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SITE_URL || "https://gulfshoregroup.com";
					const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
					const longSearchLink = `${baseUrl}/api/v2/magic-login?leadId=${encodeURIComponent(lead.id)}&redirect_url=${encodeURIComponent(`${baseUrl}/Florida-Real-Estate-Search?sort=Newest-First`)}`;
					
					// Create short link to avoid sending a massive URL over SMS
					const shortCode = Math.random().toString(36).substring(2, 10);
					await prisma.shortLink.create({
						data: {
							code: shortCode,
							slug: shortCode,
							url: longSearchLink,
						}
					});
					const shortSearchLink = `${baseUrl}/api/r/${shortCode}`;
					
					const nameStr = lead.firstName ? lead.firstName : "there";
					const smsMessage = `🏠 NEW PROPERTY MATCH 🏠\n\nHi ${nameStr}, new properties matching your search just became available.\n\n👉 CLICK HERE TO VIEW YOUR NEW MATCHES:\n${shortSearchLink}\n\n— Dimitri Schwarz, Your SW Realtor | GulfShore Group`;

					// SEND SMS
					if (lead.phone) {
						console.log(`[SavedSearch] Matches found for Lead ${lead.email}. Sending SMS to ${lead.phone}.`);
						await sendSMS(lead.phone, smsMessage).catch((err) => console.error("SMS Error:", err));
					}

					// SEND EMAIL
					if (lead.email) {
						console.log(`[SavedSearch] Sending Email to ${lead.email} with ${count} properties.`);
						await sendPropertyAlert({
							to: lead.email,
							recipientName: lead.firstName || "Valued Client",
							leadId: lead.id,
							subject: `🏠 NEW PROPERTY MATCH 🏠 - New Properties Available`,
							alertTitle: "🏠 NEW PROPERTY MATCH 🏠",
							alertSubtitle: `Hi ${nameStr}, new properties matching your search just became available.`,
							properties: propertiesArray as any,
						}).catch((err) => console.error("Email Error:", err));
					}
				}

				// Always update lastNotifiedAt for processed searches to move the lookback window forward
				if (processedSearchIds.length > 0) {
					await prisma.savedSearch.updateMany({
						where: { id: { in: processedSearchIds } },
						data: { lastNotifiedAt: new Date() },
					});
				}
			} catch (userErr: any) {
				console.error(`[SavedSearch] Error processing lead ${lead.email || userId}:`, userErr?.message || userErr);
			}
		}

		console.log("[SavedSearch] Finished processing saved searches and alerts.");
	} catch (error) {
		console.error("[SavedSearch] Error processing searches:", error);
	}
}
