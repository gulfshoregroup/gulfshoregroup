import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
	try {
		const query = req.nextUrl.searchParams;
		const page = parseInt(query.get("page") || "1");
		const limit = parseInt(query.get("limit") || "10");
		const sortField = query.get("sort") || "ListPrice";
		const sortOrder = query.get("order") === "asc" ? "asc" : "desc";
		const { userId } = await auth();

		// Status: default Active for public.
		const statusParam = query.get("status") || query.get("Status") || "Active";
		const where: any = {};
		if (statusParam !== "All") {
			if (statusParam === "Sold") {
				where.StandardStatus = "Closed";
			} else {
				where.StandardStatus = statusParam;
			}
		}


		// Price Range Filter
		const minPrice = query.get("minPrice") ? Number(query.get("minPrice")) : null;
		const maxPrice = query.get("maxPrice") ? Number(query.get("maxPrice")) : null;
		if (minPrice !== null || maxPrice !== null) {
			where.ListPrice = {};
			if (minPrice !== null) where.ListPrice.gte = minPrice;
			if (maxPrice !== null) where.ListPrice.lte = maxPrice;
		}


		// Location Filters
		if (query.get("city")) {
			where.City = {
				contains: query.get("city")!,
			};
		}
		if (query.get("postalCode")) {
			where.PostalCode = query.get("postalCode")!;
		}
		if (query.get("MLSNumber")) {
			where.MLSNumber = query.get("MLSNumber")!;
		}
		if (query.get("development")) {
			where.Development = {
				contains: query.get("development")!,
			};
		}
		if (query.get("developmentName")) {
			where.Community = {
				contains: query.get("developmentName")!,
			};
		}

		// Features
		const featuresRaw = query.get("features") || "";
		const features = featuresRaw ? featuresRaw.split(",").map((f: string) => f.trim().toLowerCase()) : query.getAll("features[]").map((f: string) => f.toLowerCase());
		if (features.length > 0) {
			if (features.some((f: string) => f.includes("spa"))) where.SpaYN = true;
			if (features.some((f: string) => f.includes("waterfront"))) where.WaterfrontYN = true;
			if (features.some((f: string) => f.includes("pool"))) where.PoolPrivateYN = true;
			if (features.some((f: string) => f.includes("gulf"))) where.GulfAccessYN = true;
			if (features.some((f: string) => f.includes("garage"))) where.GarageYN = true;
		}

		// HOA Filter
		const hoa = query.get("hoa");
		if (hoa === "yes") where.WaterfrontYN = { not: null }; // placeholder — HOA field
		// Acres filter
		const minAcres = query.get("minAcres") ? parseFloat(query.get("minAcres")!) : null;
		const maxAcres = query.get("maxAcres") ? parseFloat(query.get("maxAcres")!) : null;
		if (minAcres !== null || maxAcres !== null) {
			where.LotSizeAcres = {};
			if (minAcres !== null) where.LotSizeAcres.gte = minAcres;
			if (maxAcres !== null) where.LotSizeAcres.lte = maxAcres;
		}

		// Bedroom/Bathroom filters
		const bedsParam = query.get("beds");
		if (bedsParam) where.BedroomsTotal = { gte: parseInt(bedsParam) };
		const bathsParam = query.get("baths");
		if (bathsParam) where.BathroomsFull = { gte: parseInt(bathsParam) };

		// Living Area (Sqft)
		const minSqftParam = query.get("minSqft") || query.get("minSqFt") || query.get("sqft");
		const maxSqftParam = query.get("maxSqft") || query.get("maxSqFt");
		if (minSqftParam || maxSqftParam) {
			where.LivingArea = {};
			if (minSqftParam) where.LivingArea.gte = parseFloat(minSqftParam);
			if (maxSqftParam) where.LivingArea.lte = parseFloat(maxSqftParam);
		}

		// Year Built
		const builtYearMin = query.get("builtYearMin") ? parseInt(query.get("builtYearMin")!) : null;
		const builtYearMax = query.get("builtYearMax") ? parseInt(query.get("builtYearMax")!) : null;
		if (builtYearMin !== null || builtYearMax !== null) {
			where.YearBuilt = {};
			if (builtYearMin !== null) where.YearBuilt.gte = builtYearMin;
			if (builtYearMax !== null) where.YearBuilt.lte = builtYearMax;
		}


		// Bounding Box Location Filter
		if (
			query.get("north") &&
			query.get("south") &&
			query.get("east") &&
			query.get("west")
		) {
			const north = parseFloat(query.get("north")!);
			const south = parseFloat(query.get("south")!);
			const east = parseFloat(query.get("east")!);
			const west = parseFloat(query.get("west")!);
			where.AND = [
				{ Latitude: { gte: south, lte: north } },
				{ Longitude: { gte: west, lte: east } },
			];
		}

		// Beds & Baths Filter - Already handled above

		// Year Built Filter - Already handled above


		// Property Types Filter
		const types = query.getAll("propertyTypes[]");
		if (types.length > 0) {
			const orConditions: any[] = [];
			if (types.includes("Homes")) {
				orConditions.push({ PropertySubType: "Single Family Residence" });
			}
			if (types.includes("Condos")) {
				orConditions.push({
					PropertySubType: {
						in: ["Low Rise (1-3)", "Mid Rise (4-7)", "High Rise (8+)", "Townhouse"],
					},
				});
			}
			if (types.includes("Residential-Lots")) {
				orConditions.push({ PropertyType: "Land" });
			}

			if (orConditions.length > 0) {
				where.OR = orConditions;
			}
		}

		// Map sort field to Prisma compatible column name
		let prismaSortField = sortField;
		if (sortField === "CurrentPrice") prismaSortField = "ListPrice";
		if (sortField === "CreatedDate") prismaSortField = "createdAt";
		if (sortField === "OnMarketDate") prismaSortField = "OnMarketDate";

		const [total, properties] = await Promise.all([
			prisma.property.count({ where }),
			prisma.property.findMany({
				where,
				orderBy: {
					[prismaSortField]: sortOrder,
				},
				skip: (page - 1) * limit,
				take: limit,
					select: {
					id: true, FullAddress: true, PropertyType: true, ListPrice: true,
					Latitude: true, Longitude: true, createdAt: true, images: true,
					PropertySubType: true, LotSizeAcres: true, LivingArea: true,
					BathroomsFull: true, BedroomsTotal: true, StandardStatus: true,
					YearBuilt: true, City: true, PostalCode: true, MLSNumber: true,
					Development: true, Community: true,
					WaterfrontYN: true, GarageYN: true, PoolPrivateYN: true,
					ListingKey: true, ListingId: true, raw: true,
				},
			}),
		]);

		// User Wishlist logic
		let userWishlistedIds = new Set<string>();
		if (userId) {
			const lead = await prisma.lead.findUnique({
				where: { userId },
				select: { id: true },
			});
			if (lead) {
				const wishlists = await prisma.savedProperty.findMany({
					where: { leadId: lead.id },
					select: { propertyId: true },
				});
				userWishlistedIds = new Set(wishlists.map((w: any) => w.propertyId));
			}
		}

		// Map properties back to Mongoose representation for Frontend compatibility
		const mappedData = properties.map((p: any) => {
			// Extract images from raw.Media if images field is null
			let sourceImages = p.images;
			if (!sourceImages && p.raw && (p.raw as any).Media) {
				sourceImages = (p.raw as any).Media;
			}
			const imagesArray = Array.isArray(sourceImages) ? (sourceImages as any[]) : [];
			const imagePaths = imagesArray.map((img: any) => img.MediaURL || img);
			const defaultPic = imagePaths.length > 0 ? imagePaths[0] : "";
			return {
				_id: p.id,
				PropertyAddress: p.FullAddress,
				FullAddress: p.FullAddress,
				LotType: p.PropertyType,
				CurrentPrice: p.ListPrice || 0,
				Latitude: p.Latitude || 0,
				Longitude: p.Longitude || 0,
				CreatedDate: p.createdAt,
				AllPixList: imagePaths,
				DefaultPic: defaultPic,
				PropertyClass: p.PropertySubType || "",
				Acres: p.LotSizeAcres ? String(p.LotSizeAcres) : "",
				ApproxLivingArea: p.LivingArea ? String(p.LivingArea) : "",
				BathsTotal: p.BathroomsFull ? String(p.BathroomsFull) : "0",
				BedsTotal: p.BedroomsTotal ? String(p.BedroomsTotal) : "0",
				Status: p.StandardStatus,
				PropertyType: p.PropertyType || "",
				YearBuilt: p.YearBuilt || 0,
				City: p.City,
				PostalCode: p.PostalCode || "",
				MLSNumber: p.MLSNumber,
				Development: p.Development || "",
				DevelopmentName: p.Community || "",
				OwnershipDesc: p.OwnershipDesc || "",
				ListOfficeName: p.ListOfficeName || "",
				WaterfrontYN: p.WaterfrontYN ? "1" : "0",
				GulfAccessYN: p.GulfAccessYN ? "1" : "0",
				PrivatePoolYN: p.PoolPrivateYN ? "1" : "0",
				PrivateSpaYN: p.SpaYN ? "1" : "0",
				isWishlisted: userWishlistedIds.has(p.id) || userWishlistedIds.has(p.ListingKey),
			};
		});

		return NextResponse.json({
			success: true,
			total,
			page,
			totalPages: Math.ceil(total / limit),
			data: mappedData,
		});
	} catch (error: any) {
		console.error("Error in properties search:", error);
		return NextResponse.json(
			{ msg: "Server Error", error: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const data = await req.json();

		if (!data.MLSNumber || !data.FullAddress || !data.City || !data.StandardStatus) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields (MLSNumber, FullAddress, City, StandardStatus)" },
				{ status: 400 }
			);
		}

		const listingId = crypto.randomUUID();
		const listingKey = crypto.randomUUID();

		const property = await prisma.property.create({
			data: {
				ListingId: listingId,
				ListingKey: listingKey,
				MLSNumber: data.MLSNumber,
				FullAddress: data.FullAddress,
				City: data.City,
				SubdivisionName: data.SubdivisionName || data.Community || null,
				Development: data.SubdivisionName || data.Community || null,
				StandardStatus: data.StandardStatus,
				ListPrice: data.ListPrice ? Number(data.ListPrice) : null,
				PropertyType: data.PropertyType || null,
				BedroomsTotal: data.BedroomsTotal ? Number(data.BedroomsTotal) : null,
				BathroomsFull: data.BathroomsFull ? Number(data.BathroomsFull) : null,
				LivingArea: data.LivingArea ? Number(data.LivingArea) : null,
				images: data.ImageUrl ? [data.ImageUrl] : [],
				raw: {},
			},
		});


		return NextResponse.json({ success: true, data: property }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating property:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Failed to create property" },
			{ status: 500 }
		);
	}
}
