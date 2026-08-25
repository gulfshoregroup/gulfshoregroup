import prisma from "@/lib/prisma";
import { redisGet, redisSet } from "@/lib/safeRedis";

const MARKET_REPORT_CACHE_TTL = 1800; // 30 Minutes

export interface MarketReportData {
	city?: string;
	community?: string;
	activeListings: number;
	medianListPrice: number;
	avgDaysOnMarket: number;
	avgPricePerSqft: number;
	propertyTypes: Array<{
		type: string;
		count: number;
		percentage: number;
	}>;
	lastUpdated: string;
}

export async function getMarketReportData(params: {
	city?: string;
	community?: string;
}): Promise<MarketReportData> {
	const normalizedCity = params.city?.trim();
	const normalizedCommunity = params.community?.trim();

	const cacheKey = `market_report_v2:${normalizedCity?.toLowerCase() || "all"}:${normalizedCommunity?.toLowerCase() || "all"}`;

	// 1. Try Redis Cache
	try {
		const cached = await redisGet(cacheKey);
		if (cached) {
			const parsed = typeof cached === "string" ? JSON.parse(cached) : cached;
			return parsed as MarketReportData;
		}
	} catch (e) {
		console.warn("Market report Redis cache read warning:", e);
	}

	// 2. Query DB using select (optimizing fields)
	const whereCondition: any = {
		StandardStatus: "Active",
	};

	if (normalizedCity) {
		whereCondition.City = {
			equals: normalizedCity,
		};
	}

	if (normalizedCommunity) {
		whereCondition.Community = {
			equals: normalizedCommunity,
		};
	}

	const properties = await prisma.property.findMany({
		where: whereCondition,
		select: {
			ListPrice: true,
			DaysOnMarket: true,
			LivingArea: true,
			PropertyType: true,
			OnMarketDate: true,
		},
		take: 2000, // Safe sample ceiling for stats calculation
	});

	const activeListings = properties.length;

	if (activeListings === 0) {
		const emptyResult: MarketReportData = {
			city: normalizedCity,
			community: normalizedCommunity,
			activeListings: 0,
			medianListPrice: 0,
			avgDaysOnMarket: 0,
			avgPricePerSqft: 0,
			propertyTypes: [],
			lastUpdated: new Date().toISOString(),
		};
		return emptyResult;
	}

	// Calculate Median List Price
	const validPrices = properties
		.map((p) => p.ListPrice)
		.filter((p): p is number => p !== null && p > 0)
		.sort((a, b) => a - b);

	let medianListPrice = 0;
	if (validPrices.length > 0) {
		const mid = Math.floor(validPrices.length / 2);
		medianListPrice =
			validPrices.length % 2 !== 0
				? validPrices[mid]
				: Math.round((validPrices[mid - 1] + validPrices[mid]) / 2);
	}

	// Calculate Average Days on Market Dynamically (Today - OnMarketDate)
	const now = new Date().getTime();
	const doms = properties
		.map((p) => {
			if (p.OnMarketDate) {
				const timeDiff = now - new Date(p.OnMarketDate).getTime();
				const days = Math.floor(timeDiff / (1000 * 3600 * 24));
				return days >= 0 ? days : 0;
			}
			// Fallback to static DaysOnMarket if OnMarketDate is missing
			return p.DaysOnMarket;
		})
		.filter((d): d is number => d !== null && d !== undefined && d >= 0);
		
	const avgDaysOnMarket =
		doms.length > 0
			? Math.round(doms.reduce((sum, val) => sum + val, 0) / doms.length)
			: 0;

	// Calculate Average Price per SqFt
	const ppsqftList = properties
		.filter((p) => p.ListPrice && p.LivingArea && p.LivingArea > 0)
		.map((p) => (p.ListPrice as number) / (p.LivingArea as number));

	const avgPricePerSqft =
		ppsqftList.length > 0
			? Math.round(ppsqftList.reduce((sum, val) => sum + val, 0) / ppsqftList.length)
			: 0;

	// Calculate Property Type Breakdown
	const typeCounts: Record<string, number> = {};
	for (const p of properties) {
		const typeName = p.PropertyType || "Other";
		typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
	}

	const propertyTypes = Object.entries(typeCounts).map(([type, count]) => ({
		type,
		count,
		percentage: Math.round((count / activeListings) * 100),
	}));

	const reportData: MarketReportData = {
		city: normalizedCity,
		community: normalizedCommunity,
		activeListings,
		medianListPrice,
		avgDaysOnMarket,
		avgPricePerSqft,
		propertyTypes,
		lastUpdated: new Date().toISOString(),
	};

	// 3. Store in Redis Cache
	try {
		await redisSet(cacheKey, JSON.stringify(reportData), MARKET_REPORT_CACHE_TTL);
	} catch (e) {
		console.warn("Market report Redis cache set warning:", e);
	}

	return reportData;
}
