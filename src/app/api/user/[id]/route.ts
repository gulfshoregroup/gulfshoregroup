import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const userRecord = await prisma.lead.findUnique({
			where: { id },
		});

		const user = userRecord ? {
			...userRecord,
			_id: userRecord.id,
			clerkId: userRecord.userId,
			name: userRecord.fullName || `${userRecord.firstName || ""} ${userRecord.lastName || ""}`.trim() || "Unknown User",
			profileImage: "",
			isActive: true,
			propertyCriteria: (userRecord.tags as any)?.propertyCriteria || [],
		} : null;

		if (user) {
			const [
				searchHistory,
				viewed,
				wishlist,
				savedSearch,
			] = await Promise.all([
				prisma.searchHistory.findMany({
					where: { userId: id },
					orderBy: { updatedAt: "desc" },
				}),

				prisma.viewedProperty.findMany({
					where: { userId: id },
					orderBy: { lastViewedAt: "desc" },
				}),

				prisma.savedProperty.findMany({
					where: { leadId: id },
					orderBy: { createdAt: "desc" },
				}),

				prisma.savedSearch.findMany({
					where: { userId: id },
					orderBy: { createdAt: "desc" },
				}),
			]);

			// Resolve property details for viewed properties
			const viewedPropertyIds = viewed.map((v) => v.propertyId);
			const viewedPropertiesData = await prisma.property.findMany({
				where: { id: { in: viewedPropertyIds } },
				select: {
					id: true,
					FullAddress: true,
					City: true,
					ListPrice: true,
					Development: true,
					MLSNumber: true,
				},
			});

			const viewedProperties = viewed.map((v) => {
				const prop = viewedPropertiesData.find((p) => p.id === v.propertyId);
				return {
					id: v.id,
					userId: v.userId,
					propertyId: v.propertyId,
					viewCount: v.viewCount,
					lastViewed: v.lastViewedAt,
					createdAt: v.viewedAt,
					property: prop
						? {
								_id: prop.id,
								PropertyAddress: prop.FullAddress,
								City: prop.City,
								CurrentPrice: prop.ListPrice || 0,
								Development: prop.Development || "",
								MLSNumber: prop.MLSNumber,
						  }
						: null,
				};
			});

			// Resolve property details for wishlist properties
			const wishlistPropertyIds = wishlist.map((w) => w.propertyId);
			const wishlistPropertiesData = await prisma.property.findMany({
				where: { id: { in: wishlistPropertyIds } },
				select: {
					id: true,
					FullAddress: true,
					City: true,
					ListPrice: true,
					Development: true,
					MLSNumber: true,
				},
			});

			const wishlistProperties = wishlist.map((w) => {
				const prop = wishlistPropertiesData.find((p) => p.id === w.propertyId);
				return {
					id: w.id,
					userId: w.leadId,
					propertyId: w.propertyId,
					createdAt: w.createdAt,
					property: prop
						? {
								_id: prop.id,
								PropertyAddress: prop.FullAddress,
								City: prop.City,
								CurrentPrice: prop.ListPrice || 0,
								Development: prop.Development || "",
								MLSNumber: prop.MLSNumber,
						  }
						: null,
				};
			});

			// Map SearchHistory to the format frontend expects
			const mappedSearchHistory = searchHistory.map((s) => ({
				_id: s.id,
				searchCount: s.resultCount || 1,
				searchQuery: s.filters || {},
				lastSearched: s.updatedAt,
			}));

			return NextResponse.json({
				success: true,
				data: {
					user,
					searchHistory: mappedSearchHistory,
					viewedProperties,
					wishlistProperties,
					savedSearch,
				},
			});
		}

		return NextResponse.json({
			success: false,
			message: "No User Found",
		});
	} catch (error) {
		console.error("Error fetching user dashboard data:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
