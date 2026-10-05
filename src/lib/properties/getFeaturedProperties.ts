import prisma from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/safeRedis";
import { Property } from "@/app/generated/prisma/client";
import featuredSnapshot from "./featuredPropertiesSnapshot.json";

// In-memory cache for ultra-fast (0ms) response across requests
const globalForFeatured = globalThis as unknown as {
	featuredPropertiesCache?: {
		data: Property[];
		expiresAt: number;
	};
	featuredFetchPromise?: Promise<Property[]> | null;
};

const FEATURED_CACHE_KEY = "featured:home:latest:v2";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in-memory

export async function getFeaturedProperties(): Promise<Property[]> {
	const now = Date.now();

	// 1. Check ultra-fast in-memory cache (< 1ms)
	if (
		globalForFeatured.featuredPropertiesCache &&
		globalForFeatured.featuredPropertiesCache.expiresAt > now &&
		globalForFeatured.featuredPropertiesCache.data.length > 0
	) {
		return globalForFeatured.featuredPropertiesCache.data;
	}

	// 2. Check Redis cache
	try {
		const cached = await redisGet(FEATURED_CACHE_KEY);
		if (cached) {
			const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
			if (Array.isArray(parsed) && parsed.length > 0) {
				globalForFeatured.featuredPropertiesCache = {
					data: parsed,
					expiresAt: now + CACHE_TTL_MS,
				};
				return parsed;
			}
		}
	} catch (err) {
		console.warn("Redis check failed in getFeaturedProperties:", err);
	}

	// 3. If a database query is already in flight, reuse its promise (deduplication)
	if (globalForFeatured.featuredFetchPromise) {
		return globalForFeatured.featuredFetchPromise;
	}

	// 4. Query Database with Stale-While-Revalidate pattern
	// If snapshot is available, we can return snapshot immediately on cold start and refresh in background
	const snapshotData = (featuredSnapshot as unknown as Property[]) || [];

	const fetchFromDb = async (): Promise<Property[]> => {
		try {
			const properties = await prisma.property.findMany({
				where: {
					StandardStatus: "Active",
					ListPrice: { gte: 500000, not: null },
					FullAddress: { not: "" },
					NOT: [
						{ PropertyType: { contains: "Lease" } },
						{ images: { equals: "null" as any } },
					],
				} as any,
				take: 8,
				orderBy: { OnMarketTimestamp: "desc" },
				select: {
					id: true,
					ListingKey: true,
					ListingId: true,
					MLSNumber: true,
					SourceSystemKey: true,
					Development: true,
					Community: true,
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
					ListPrice: true,
					ClosePrice: true,
					OriginalListPrice: true,
					PriceChangeTimestamp: true,
					City: true,
					StateOrProvince: true,
					PostalCode: true,
					CountyOrParish: true,
					FullAddress: true,
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
					LotSizeAcres: true,
					LotSizeSquareFeet: true,
					LotSizeArea: true,
					LotSizeUnits: true,
					SubdivisionName: true,
					MLSAreaMajor: true,
					MLSAreaMinor: true,
					Directions: true,
					Latitude: true,
					Longitude: true,
					MapCoordinate: true,
					HeatingYN: true,
					CoolingYN: true,
					GarageYN: true,
					GarageSpaces: true,
					AttachedGarageYN: true,
					CarportYN: true,
					CarportSpaces: true,
					CoveredSpaces: true,
					ParkingTotal: true,
					WaterfrontYN: true,
					ViewYN: true,
					View: true,
					GulfAccessYN: true,
					PoolPrivateYN: true,
					SpaYN: true,
					AssociationYN: true,
					AssociationFee: true,
					AssociationFeeFrequency: true,
					AssociationAmenities: true,
					CommunityFeatures: true,
					DaysOnMarket: true,
					NewConstructionYN: true,
					Furnished: true,
					PossessionType: true,
					Zoning: true,
					ZoningDescription: true,
					LandLeaseYN: true,
					TaxYear: true,
					MasterHOAFee: true,
					HOAFee: true,
					HOAFeeFreq: true,
					MasterHOAFeeFreq: true,
					MandatoryHOAYN: true,
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
			});

			if (properties && properties.length > 0) {
				const typedProps = properties as unknown as Property[];
				globalForFeatured.featuredPropertiesCache = {
					data: typedProps,
					expiresAt: Date.now() + CACHE_TTL_MS,
				};
				redisSet(FEATURED_CACHE_KEY, JSON.stringify(typedProps), 600).catch(() => {});
				return typedProps;
			}
		} catch (dbErr) {
			console.error("Error fetching featured properties from DB:", dbErr);
		} finally {
			globalForFeatured.featuredFetchPromise = null;
		}

		// Fallback to snapshot if DB fails
		return snapshotData;
	};

	// If we have cached snapshot data and in-memory is cold, return snapshot immediately and update in background
	if (snapshotData.length > 0) {
		globalForFeatured.featuredPropertiesCache = {
			data: snapshotData,
			expiresAt: now + 30 * 1000, // short TTL so background refreshes quickly
		};
		// Trigger background refresh
		globalForFeatured.featuredFetchPromise = fetchFromDb();
		return snapshotData;
	}

	globalForFeatured.featuredFetchPromise = fetchFromDb();
	return globalForFeatured.featuredFetchPromise;
}
