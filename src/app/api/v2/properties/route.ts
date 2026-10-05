import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/safeRedis";
import { getFeaturedProperties } from "@/lib/properties/getFeaturedProperties";

const MAX_LIMIT = 200;

function parseNumber(value?: string | null) {
	if (!value) return undefined;
	const n = Number(value);
	return Number.isFinite(n) ? n : undefined;
}

// High-speed in-memory cache for search results (persisted across Next.js dev server re-evaluations)
const globalForSearch = globalThis as unknown as {
	searchMemoryCache?: Map<string, { data: any; expiresAt: number }>;
	countMemoryCache?: Map<string, { count: number; expiresAt: number }>;
};

const searchMemoryCache = globalForSearch.searchMemoryCache || new Map<string, { data: any; expiresAt: number }>();
const countMemoryCache = globalForSearch.countMemoryCache || new Map<string, { count: number; expiresAt: number }>();

if (process.env.NODE_ENV !== "production") {
	globalForSearch.searchMemoryCache = searchMemoryCache;
	globalForSearch.countMemoryCache = countMemoryCache;
}

function getFromSearchMemory(key: string) {
	const item = searchMemoryCache.get(key);
	if (item && item.expiresAt > Date.now()) return item.data;
	if (item) searchMemoryCache.delete(key);
	return null;
}

function setInSearchMemory(key: string, data: any, ttlSeconds = 600) {
	if (searchMemoryCache.size > 2000) {
		const firstKey = searchMemoryCache.keys().next().value;
		if (firstKey) searchMemoryCache.delete(firstKey);
	}
	searchMemoryCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function GET(req: NextRequest) {
	try {
		const query = req.nextUrl.searchParams;
		const cacheKey = "search:v2:" + query.toString();

		// 1️⃣ FAST IN-MEMORY CACHE (< 1ms response)
		const memCached = getFromSearchMemory(cacheKey);
		if (memCached) return NextResponse.json(memCached);

		// 2️⃣ REDIS CACHE
		const cached = await redisGet(cacheKey);
		if (cached) {
			const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
			setInSearchMemory(cacheKey, parsed, 600);
			return NextResponse.json(parsed);
		}

		// ---- Pagination ----
		const page = Math.max(1, Number(query.get("page") || 1));
		const limit = Math.min(
			MAX_LIMIT,
			Math.max(1, Number(query.get("limit") || 10))
		);
		const skip = (page - 1) * limit;

		// 3️⃣ FAST-PATH FOR HOMEPAGE FEATURED WIDGET (< 1ms response)
		const isHomeFeaturedQuery =
			(query.get("sort") === "OnMarketTimestamp" || query.get("sort") === "Newest-First") &&
			limit === 8 &&
			(query.get("order") === "desc" || !query.get("order")) &&
			Number(query.get("minPrice")) === 500000 &&
			!query.get("city") &&
			!query.get("developmentName") &&
			!query.get("q") &&
			!query.get("search") &&
			!query.get("beds") &&
			!query.get("baths");

		if (isHomeFeaturedQuery) {
			const featured = await getFeaturedProperties();
			const responsePayload = {
				success: true,
				count: featured.length,
				data: featured,
				total: featured.length,
				page: 1,
				limit: 8,
				totalPages: 1,
			};
			setInSearchMemory(cacheKey, responsePayload, 600);
			return NextResponse.json(responsePayload);
		}

		// ---- Sorting ----
		let sortField = query.get("sort") || "ListPrice";
		let sortOrder = query.get("order") === "asc" ? "asc" : "desc";

		// Handle string literal sort values that might come from URL query parameters
		if (sortField === "Newest-First") {
			sortField = "CreatedDate";
			sortOrder = "desc";
		} else if (sortField === "Oldest-First") {
			sortField = "CreatedDate";
			sortOrder = "asc";
		} else if (sortField === "Price-High-to-Low") {
			sortField = "CurrentPrice";
			sortOrder = "desc";
		} else if (sortField === "Price-Low-to-High") {
			sortField = "CurrentPrice";
			sortOrder = "asc";
		}

		if (sortField === "CurrentPrice") {
			sortField = "ListPrice";
		} else if (sortField === "CreatedDate") {
			sortField = "OnMarketTimestamp";
		}

		// ---- WHERE CLAUSE ----
		const where: any = {};

		// ---- Listing Status ----
		let isMockingClosed = false;
		const statusVal = query.get("status") || query.get("Status") || "Active";
		if (statusVal && statusVal !== "All") {
			if (statusVal === "Sold" || statusVal === "Closed") {
				where.StandardStatus = { in: ["Closed", "Sold"] };
				isMockingClosed = false;
			} else if (statusVal === "Short Sale" || statusVal === "Foreclosure") {
				// Short sale / foreclosure fall back to Active or check description/raw if they exist in active listings
				where.StandardStatus = "Active";
				where.AND = where.AND || [];
				where.AND.push({
					Description: { contains: statusVal }
				});
			} else if (statusVal === "Pending") {
				where.StandardStatus = { contains: "Pending" };
			} else if (statusVal === "Active") {
				where.StandardStatus = "Active";
			} else {
				where.StandardStatus = { contains: statusVal };
			}
		}

		// ---- Price ----
		const minPrice = parseNumber(query.get("minPrice"));
		const maxPrice = parseNumber(query.get("maxPrice"));
		if (minPrice || maxPrice) {
			where.ListPrice = {
				...(minPrice && { gte: minPrice }),
				...(maxPrice && { lte: maxPrice }),
				not: null,
			};
		} else {
			where.ListPrice = {
				not: null,
				gte: 1000,
			};
		}

		where.NOT = where.NOT || [];
		where.NOT.push({ PropertyType: { contains: "Lease" } });

		// ---- Exclude blank listings (no address or no images) ----
		where.FullAddress = { not: "" };
		where.NOT = where.NOT || [];
		where.NOT.push(
			{ images: { equals: null } },
		);

		// ---- Location ----
		if (query.get("city")) {
			where.City = {
				contains: query.get("city")!,
			};
		}

		if (query.get("developmentName")) {
			where.Community = {
				contains: query.get("developmentName")!,
			};
		}

		if (query.get("postalCode")) {
			where.PostalCode = query.get("postalCode")!;
		}

		const mlsVal = query.get("MLSNumber") || query.get("mls");
		if (mlsVal) {
			where.AND = where.AND || [];
			where.AND.push({
				OR: [
					{ MLSNumber: mlsVal },
					{ ListingId: mlsVal },
				],
			});
		}

		// ---- Exclude a specific MLS number (used on property detail page to hide current listing) ----
		const excludeMLS = query.get("excludeMLS");
		if (excludeMLS) {
			where.NOT = where.NOT || [];
			where.NOT.push({ MLSNumber: excludeMLS });
		}

		if (query.get("subdivision")) {
			where.SubdivisionName = {
				contains: query.get("subdivision")!,
			};
		}

		if (query.get("school")) {
			where.AND = where.AND || [];
			where.AND.push({
				OR: [
					{ Description: { contains: query.get("school")! } },
					{ SubdivisionName: { contains: query.get("school")! } },
					{ Community: { contains: query.get("school")! } },
				],
			});
		}

		if (query.get("address")) {
			where.FullAddress = {
				contains: query.get("address")!,
			};
		}

		const qVal = query.get("q") || query.get("search");
		if (qVal) {
			where.AND = where.AND || [];
			where.AND.push({
				OR: [
					{ City: { contains: qVal } },
					{ Community: { contains: qVal } },
					{ SubdivisionName: { contains: qVal } },
					{ PostalCode: { contains: qVal } },
					{ MLSNumber: { contains: qVal } },
					{ ListingId: { contains: qVal } },
					{ FullAddress: { contains: qVal } },
					{ Description: { contains: qVal } },
				],
			});
		}

		// ---- Beds & Baths ----
		const beds = parseNumber(query.get("beds"));
		if (beds) where.BedroomsTotal = { gte: beds };

		const baths = parseNumber(query.get("baths"));
		if (baths) where.BathroomsFull = { gte: baths };

		// ---- Living Area (Sqft) ----
		const minSqft = parseNumber(query.get("minSqft") || query.get("minSqFt") || query.get("sqft"));
		const maxSqft = parseNumber(query.get("maxSqft") || query.get("maxSqFt"));
		if (minSqft || maxSqft) {
			where.LivingArea = {
				...(minSqft && { gte: minSqft }),
				...(maxSqft && { lte: maxSqft }),
			};
		}

		// ---- Year Built ----
		const builtMin = parseNumber(query.get("builtYearMin"));
		const builtMax = parseNumber(query.get("builtYearMax"));
		if (builtMin || builtMax) {
			where.YearBuilt = {
				...(builtMin && { gte: builtMin }),
				...(builtMax && { lte: builtMax }),
			};
		}

		// ---- HOA Mandatory ----
		const hoaVal = query.get("hoa");
		if (hoaVal === "Yes") {
			where.MandatoryHOAYN = true;
		} else if (hoaVal === "No") {
			where.MandatoryHOAYN = false;
		}

		// ---- Acres ----
		const minAcres = parseNumber(query.get("minAcres"));
		const maxAcres = parseNumber(query.get("maxAcres"));
		if (minAcres || maxAcres) {
			where.LotSizeAcres = {
				...(minAcres && { gte: minAcres }),
				...(maxAcres && { lte: maxAcres }),
			};
		}

		// ---- Features ----
		let features: string[] = [];
		const featuresCsv = query.get("features");
		if (featuresCsv) {
			features = featuresCsv.split(",").map(f => f.trim().toLowerCase());
		} else {
			features = query.getAll("features[]").map(f => f.toLowerCase());
		}

		if (features.includes("waterfront")) where.WaterfrontYN = true;
		if (features.includes("pool")) where.PoolPrivateYN = true;
		if (features.includes("gulf access")) where.GulfAccessYN = true;
		if (features.includes("spa")) where.SpaYN = true;
		if (features.includes("garage")) where.GarageYN = true;
		
		// If any view type features are chosen
		if (features.some(f => f.includes("view"))) {
			where.ViewYN = true;
		}

		// ---- Property Types ----
		let propTypes: string[] = [];
		const propTypesCsv = query.get("propertyTypes");
		if (propTypesCsv) {
			propTypes = propTypesCsv.split(",").map(t => t.trim());
		} else {
			propTypes = query.getAll("propertyTypes[]");
		}

		if (propTypes.length) {
			const propTypeOR: any[] = [];

			// Homes → Single Family + Townhouse
			if (propTypes.includes("Homes")) {
				propTypeOR.push({
					PropertySubType: "Single Family Residence",
				});
			}

			// Condos → Low / Mid / High Rise / Townhouse
			if (propTypes.includes("Condos")) {
				propTypeOR.push({
					PropertySubType: {
						in: [
							"Low Rise (1-3)",
							"Mid Rise (4-7)",
							"High Rise (8+)",
							"Townhouse",
						],
					},
				});
			}

			// Residential Lots
			if (propTypes.includes("Residential-Lots")) {
				propTypeOR.push({
					AND: [
						{
							PropertyType: "Land",
						},
					],
				});
			}

			if (propTypeOR.length > 0) {
				where.AND = where.AND || [];
				where.AND.push({ OR: propTypeOR });
			}
		} else {
			// Hide Land by default if no specific property types are requested
			where.PropertyType = {
				not: "Land",
			};
		}

		// ---- Geo Bounding Box ----
		const north = parseNumber(query.get("north"));
		const south = parseNumber(query.get("south"));
		const east = parseNumber(query.get("east"));
		const west = parseNumber(query.get("west"));

		if (north && south && east && west) {
			where.AND = where.AND || [];
			where.AND.push(
				{ Latitude: { gte: south, lte: north } },
				{ Longitude: { gte: west, lte: east } }
			);
		}

		// ---- Queries ----
		// For small widget/slider limits (limit <= 12, skip === 0, no page query), skip expensive 12s count scan
		const isWidgetQuery = skip === 0 && limit <= 12 && !query.get("page") && query.get("count") !== "true";
		
		let totalPromise: Promise<number>;
		if (isWidgetQuery) {
			totalPromise = Promise.resolve(0);
		} else {
			const countKey = JSON.stringify(where);
			const cachedCount = countMemoryCache.get(countKey);
			if (cachedCount && cachedCount.expiresAt > Date.now()) {
				totalPromise = Promise.resolve(cachedCount.count);
			} else {
				totalPromise = prisma.property.count({ where }).then(cnt => {
					countMemoryCache.set(countKey, { count: cnt, expiresAt: Date.now() + 300 * 1000 });
					return cnt;
				});
			}
		}

		const [total, properties] = await Promise.all([
			totalPromise,
			prisma.property.findMany({
				where,
				skip,
				take: limit,
				select: {
					id: true,
				  
					// ---- Bridge Identity ----
					ListingKey: true,
					ListingId: true,
					MLSNumber: true,
					SourceSystemKey: true,
					Development: true,
					Community: true,
				  
					// ---- Status & Dates ----
					StandardStatus: true,
					MlsStatus: true,
					StatusType: true,
					OnMarketDate: true,
					OnMarketTimestamp: true,
					StatusChangeTimestamp: true,
					ModificationTimestamp: true,
					BridgeModificationTimestamp: true,
					MajorChangeType: true,
					MajorChangeTimestamp: true,
				  
					// ---- Pricing ----
					ListPrice: true,
					ClosePrice: true,
					OriginalListPrice: true,
					PriceChangeTimestamp: true,
				  
					City: true,
					StateOrProvince: true,
					PostalCode: true,
					CountyOrParish: true,
					FullAddress: true,
				  
					// ---- Property Info ----
					Description: true,
					PropertyType: true,
					PropertySubType: true,
					BedroomsTotal: true,
					BathroomsFull: true,
					BathroomsHalf: true,
					BathroomsTotalInteger: true,
					BathroomsTotalDecimal: true,
					LivingArea: true,
					LivingAreaUnits: true,
					BuildingAreaTotal: true,
					BuildingAreaUnits: true,
					YearBuilt: true,
					StoriesTotal: true,
					RoomsTotal: true,
				  
					// ---- Lot Info ----
					LotSizeAcres: true,
					LotSizeSquareFeet: true,
					LotSizeArea: true,
					LotSizeUnits: true,
				  
					// ---- Location Details ----
					SubdivisionName: true,
					MLSAreaMajor: true,
					MLSAreaMinor: true,
					Directions: true,
				  
					// ---- Geo ----
					Latitude: true,
					Longitude: true,
					MapCoordinate: true,
				  
					HeatingYN: true,
					CoolingYN: true,
				  
					// ---- Parking & Garage ----
					GarageYN: true,
					GarageSpaces: true,
					AttachedGarageYN: true,
					CarportYN: true,
					CarportSpaces: true,
					CoveredSpaces: true,
					ParkingTotal: true,
				  
					// ---- Water & Outdoor ----
					WaterfrontYN: true,
					ViewYN: true,
					View: true,
					GulfAccessYN: true,
					PoolPrivateYN: true,
					SpaYN: true,
				  
					// ---- Community & Association ----
					AssociationYN: true,
					AssociationFee: true,
					AssociationFeeFrequency: true,
					AssociationAmenities: true,
					CommunityFeatures: true,
					DaysOnMarket: true,
				  
					// ---- Property Condition ----
					NewConstructionYN: true,
					Furnished: true,
					PossessionType: true,
					Zoning: true,
					ZoningDescription: true,
					LandLeaseYN: true,
				  
					// ---- Financial ----
					TaxYear: true,
					MasterHOAFee: true,
					HOAFee: true,
					HOAFeeFreq: true,
					MasterHOAFeeFreq: true,
					MandatoryHOAYN: true,
				  
					// ---- Agent & Office Info ----
					ListAgentFullName: true,
					ListAgentKey: true,
					ListAgentMlsId: true,
					ListAgentEmail: true,
					ListAgentDirectPhone: true,
					ListAgentCellPhone: true,
					ListAgentOfficePhone: true,
					ListAgentOfficePhoneExt: true,
				  
					ListOfficeName: true,
					ListOfficeKey: true,
					ListOfficeMlsId: true,
					ListOfficeEmail: true,
					ListOfficePhone: true,
					ListOfficePhoneExt: true,
				  
					// ---- Media & Virtual Tours ----
					PhotosCount: true,
					PhotosChangeTimestamp: true,
					VideosCount: true,
					VideosChangeTimestamp: true,
					VirtualTourURLUnbranded: true,
					VirtualTourURLBranded: true,
					AllPixDownloaded: true,
					images: true,
					communityId: true,
				  },
				orderBy: { [sortField]: sortOrder },
			}),
		]);

		const data = properties.map((p: any) => {
			return {
				...p,
				StandardStatus: isMockingClosed ? "Closed" : p.StandardStatus,
				images: p.images || [],
				isWishlisted: false,
			};
		});

		const effectiveTotal = total || properties.length;
		const response = {
			success: true,
			total: effectiveTotal,
			page,
			totalPages: Math.max(1, Math.ceil(effectiveTotal / limit)),
			data,
		};

		setInSearchMemory(cacheKey, response, 600);
		await redisSet(cacheKey, response, 7200);

		return NextResponse.json(response);
	} catch (error: any) {
		console.error("Search error:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
