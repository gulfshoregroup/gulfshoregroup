import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const leadsCache = new Map<string, { payload: any; ts: number }>();
const CACHE_TTL_MS = 8_000;

function clearLeadsCache() {
	leadsCache.clear();
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const sortBy = searchParams.get("sortBy") || "createdAt";
		const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

		const cacheKey = `${page}:${limit}:${sortBy}:${sortOrder}`;
		const cached = leadsCache.get(cacheKey);
		if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
			return NextResponse.json(cached.payload);
		}

		let orderByClause: any = { createdAt: "desc" };
		if (sortBy === "viewedProperties") {
			orderByClause = { viewHistory: { _count: sortOrder } };
		} else if (sortBy === "lastLogin") {
			orderByClause = { updatedAt: sortOrder };
		} else if (sortBy === "createdAt") {
			orderByClause = { createdAt: sortOrder };
		} else if (sortBy === "name") {
			orderByClause = { firstName: sortOrder };
		}

		const skip = (page - 1) * limit;

		const [rawLeads, total] = await Promise.all([
			prisma.lead.findMany({
				orderBy: orderByClause,
				skip,
				take: limit,
			}),
			prisma.lead.count(),
		]);

		const leadIds = rawLeads.map((l) => l.id);

		// Fast covering-index query using @@index([userId, lastViewedAt]) on ViewedProperty
		const viewStats =
			leadIds.length > 0
				? await prisma.viewedProperty.groupBy({
						by: ["userId"],
						where: { userId: { in: leadIds } },
						_count: { _all: true },
						_max: { lastViewedAt: true },
				  })
				: [];

		const viewStatsMap = new Map<string, { count: number; lastViewedAt: Date | null }>();
		for (const stat of viewStats) {
			viewStatsMap.set(stat.userId, {
				count: stat._count._all,
				lastViewedAt: stat._max.lastViewedAt,
			});
		}

		// Parse tags JSON + provide lastContactedAt fallback + attach view stats
		const mapped = rawLeads.map((lead) => {
			const vs = viewStatsMap.get(lead.id);
			let parsedTags: any[] = [];
			if (lead.tags) {
				try {
					parsedTags = typeof lead.tags === "string" ? JSON.parse(lead.tags) : (lead.tags as any[]);
				} catch {
					parsedTags = [];
				}
			}
			return {
				...lead,
				tags: Array.isArray(parsedTags) ? parsedTags : [],
				lastContactedAt: lead.lastContactedAt ?? lead.createdAt,
				_count: {
					viewHistory: vs?.count || 0,
				},
				viewHistory: vs?.lastViewedAt ? [{ lastViewedAt: vs.lastViewedAt }] : [],
			};
		});

		const totalPages = Math.ceil(total / limit);

		const payload = {
			success: true,
			data: mapped,
			total,
			page,
			totalPages,
		};

		leadsCache.set(cacheKey, { payload, ts: Date.now() });

		return NextResponse.json(payload);
	} catch (error) {
		console.error("Error fetching leads:", error);
		return NextResponse.json(
			{ error: "Failed to fetch leads" },
			{ status: 500 }
		);
	}
}

export async function POST(req: Request) {
	try {
		const data = await req.json();

		// Check duplicate email first to avoid Prisma crash
		const existing = await prisma.lead.findUnique({
			where: { email: data.email.toLowerCase().trim() },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "A lead with this email already exists." },
				{ status: 400 }
			);
		}

		const lead = await prisma.lead.create({
			data: {
				...data,
				email: data.email.toLowerCase().trim(),
			},
		});
		clearLeadsCache();
		return NextResponse.json(lead, { status: 201 });
	} catch (error: any) {
		console.error("Error creating lead:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create lead" },
			{ status: 500 }
		);
	}
}
