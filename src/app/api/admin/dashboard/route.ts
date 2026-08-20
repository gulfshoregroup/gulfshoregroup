import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Cache the result for 60 seconds to avoid repeated heavy DB calls
let cache: { data: any; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

export async function GET() {
	try {
		// Return cached result if still fresh
		if (cache && Date.now() - cache.ts < CACHE_TTL_MS) {
			return NextResponse.json({ success: true, data: cache.data });
		}

		const [
			totalCities,
			totalCommunities,
			totalContacts,
			totalProperties,
			totalTours,
			totalUsers,
			totalWishlistedProperties,
			totalPropertyViews
		] = await Promise.all([
			prisma.city.count(),
			prisma.community.count(),
			prisma.contactRequest.count(),
			prisma.property.count(),
			prisma.scheduleTour.count(),
			prisma.lead.count({
				where: {
					userId: {
						not: null,
					},
				},
			}),
			prisma.savedProperty.count(),
			prisma.viewedProperty.count()
		]);

		// Fetch last 7 days of signups and inquiries for the chart in parallel
		const chartPromises = [];
		for (let i = 6; i >= 0; i--) {
			const startOfDay = new Date();
			startOfDay.setDate(startOfDay.getDate() - i);
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date();
			endOfDay.setDate(endOfDay.getDate() - i);
			endOfDay.setHours(23, 59, 59, 999);

			const dateLabel = startOfDay.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});

			const promise = Promise.all([
				prisma.lead.count({
					where: {
						createdAt: {
							gte: startOfDay,
							lte: endOfDay,
						},
					},
				}),
				prisma.inquiry.count({
					where: {
						createdAt: {
							gte: startOfDay,
							lte: endOfDay,
						},
					},
				}),
			]).then(([leadsCount, inquiriesCount]) => ({
				date: dateLabel,
				Leads: leadsCount,
				Inquiries: inquiriesCount,
			}));

			chartPromises.push(promise);
		}
		const chartData = await Promise.all(chartPromises);

		const hotLeads = await prisma.lead.findMany({
			orderBy: { updatedAt: "desc" },
			take: 5,
			select: {
				id: true,
				fullName: true,
				email: true,
				phone: true,
				updatedAt: true
			}
		});

		const res = {
			TotalCities: totalCities,
			TotalCommunities: totalCommunities,
			TotalContacts: totalContacts,
			TotalProperties: totalProperties,
			TotalTours: totalTours,
			TotalSocialLogs: 0,
			TotalUsers: totalUsers,
			TotalWishlistedProperties: totalWishlistedProperties,
			TotalPropertyViews: totalPropertyViews,
			LastSocialMediaUploadTime: new Date().toISOString(),
			chartData: chartData,
			hotLeads: hotLeads
		};

		// Store in cache
		cache = { data: res, ts: Date.now() };

		return NextResponse.json({ success: true, data: res });
	} catch (error: any) {
		console.error("Error fetching admin dashboard totals:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}
