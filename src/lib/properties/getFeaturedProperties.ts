import prisma from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/safeRedis";
import { Property } from "@/app/generated/prisma/client";

// In-memory cache for ultra-fast (0ms) response across requests
const globalForFeatured = globalThis as unknown as {
	featuredPropertiesCache?: {
		data: Property[];
		expiresAt: number;
	};
	featuredFetchPromise?: Promise<Property[]> | null;
};

const FEATURED_CACHE_KEY = "featured:home:latest:v3"; // v3 = slim payload
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes in-memory

// Cards show at most 8 photos and only read MediaURL (+ MediaCategory).
function slimCardImages(imgs: any) {
	let arr = imgs;
	if (typeof arr === "string") {
		try {
			arr = JSON.parse(arr);
		} catch {
			arr = [];
		}
	}
	if (!Array.isArray(arr)) return [];
	return arr
		.map((img: any) => {
			if (typeof img === "string" && img.trim() !== "") return { MediaURL: img, MediaCategory: "Photo" };
			const url = img?.MediaURL || img?.url || img?.URL || img?.mediaUrl || img?.MediaUrl;
			return url ? { MediaURL: url, MediaCategory: img.MediaCategory || "Photo" } : null;
		})
		.filter(Boolean)
		.slice(0, 8);
}

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

	// 4. Query live Database
	const fetchFromDb = async (): Promise<Property[]> => {
		// During Docker/Next.js production build phase, private database network is not connected.
		// Return empty array immediately so the image build succeeds instantly without hanging.
		if (process.env.NEXT_PHASE === "phase-production-build") {
			return [];
		}

		try {
			const queryPromise = prisma.property.findMany({
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
				// Only the fields the property card renders. The full row (all MLS
				// photo metadata, agent contacts, HOA, zoning...) was ~170 KB of the
				// homepage HTML, serialized into the page for 8 cards.
				select: {
					id: true,
					ListingId: true,
					MLSNumber: true,
					Community: true,
					StandardStatus: true,
					MlsStatus: true,
					OnMarketDate: true,
					OnMarketTimestamp: true,
					ListPrice: true,
					ClosePrice: true,
					OriginalListPrice: true,
					City: true,
					StateOrProvince: true,
					PostalCode: true,
					FullAddress: true,
					PropertyType: true,
					PropertySubType: true,
					BedroomsTotal: true,
					BathroomsFull: true,
					LivingArea: true,
					YearBuilt: true,
					LotSizeAcres: true,
					Latitude: true,
					Longitude: true,
					WaterfrontYN: true,
					PoolPrivateYN: true,
					SpaYN: true,
					HOAFee: true,
					HOAFeeFreq: true,
					MasterHOAFee: true,
					MasterHOAFeeFreq: true,
					MandatoryHOAYN: true,
					ListOfficeName: true,
					images: true,
				},
			});

			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(() => reject(new Error("Database query timed out after 5s")), 5000)
			);

			const properties = await Promise.race([queryPromise, timeoutPromise]);

			if (properties && properties.length > 0) {
				const typedProps = properties.map((p: any) => ({
					...p,
					images: slimCardImages(p.images),
				})) as unknown as Property[];
				globalForFeatured.featuredPropertiesCache = {
					data: typedProps,
					expiresAt: Date.now() + CACHE_TTL_MS,
				};
				redisSet(FEATURED_CACHE_KEY, typedProps, 600).catch(() => {});
				return typedProps;
			}
			return [];
		} catch (dbErr) {
			console.error("Error fetching featured properties from DB:", dbErr);
			return [];
		} finally {
			globalForFeatured.featuredFetchPromise = null;
		}
	};

	// 4. Query Database (with in-flight deduplication)
	if (!globalForFeatured.featuredFetchPromise) {
		globalForFeatured.featuredFetchPromise = fetchFromDb();
	}
	return await globalForFeatured.featuredFetchPromise;
}
