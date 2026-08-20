import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 }
			);
		}

		let lead = await prisma.lead.findUnique({
			where: { userId },
		});

		if (!lead) {
			const clerkUser = await prisma.user.findUnique({
				where: { clerkId: userId },
			});
			if (clerkUser) {
				lead = await prisma.lead.findFirst({
					where: {
						OR: [
							{ email: clerkUser.email },
							{ userId: clerkUser.clerkId }
						]
					}
				});
				if (lead && !lead.userId) {
					lead = await prisma.lead.update({
						where: { id: lead.id },
						data: { userId: clerkUser.clerkId }
					});
				}
			}
		}

		if (!lead) {
			return NextResponse.json([]);
		}

		const searches = await prisma.savedSearch.findMany({
			where: { userId: lead.id },
			orderBy: { createdAt: "desc" },
		});

		const mappedSearches = searches.map((s) => {
			const sFilters = (s.filters as any) || {};
			return {
				...s,
				_id: s.id,
				user: s.userId,
				link: sFilters.link || "",
				filters: sFilters,
				subscriptionEnabled: s.notify,
				subscriptionFrequency: s.frequency,
			};
		});

		return NextResponse.json(mappedSearches);
	} catch (error) {
		console.error("Error fetching saved searches:", error);
		return NextResponse.json(
			{ error: "Failed to fetch saved searches" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { link, filters, name } = body;

		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ error: "userId is required" },
				{ status: 400 }
			);
		}

		let lead = await prisma.lead.findUnique({
			where: { userId },
		});

		if (!lead) {
			const clerkUser = await prisma.user.findUnique({
				where: { clerkId: userId },
			});
			if (clerkUser) {
				lead = await prisma.lead.findFirst({
					where: {
						OR: [
							{ email: clerkUser.email },
							{ userId: clerkUser.clerkId }
						]
					}
				});
				if (lead && !lead.userId) {
					lead = await prisma.lead.update({
						where: { id: lead.id },
						data: { userId: clerkUser.clerkId }
					});
				}
			}
		}

		if (!lead) {
			// Auto create Lead if not exists
			const clerkUser = await prisma.user.findUnique({
				where: { clerkId: userId },
			});
			if (clerkUser) {
				lead = await prisma.lead.create({
					data: {
						userId: clerkUser.clerkId,
						email: clerkUser.email,
						firstName: clerkUser.firstName || "",
						lastName: clerkUser.lastName || "",
						source: "Signup",
						status: "New",
					}
				});
			}
		}

		if (!lead) {
			return NextResponse.json(
				{ error: "Lead not found and could not be created" },
				{ status: 404 }
			);
		}

		// check if search already exists
		const allSearches = await prisma.savedSearch.findMany({
			where: { userId: lead.id }
		});
		const existingSaved = allSearches.find((s) => {
			const f = s.filters as any;
			return f?.link === link;
		});

		if (existingSaved) {
			const f = existingSaved.filters as any;
			return NextResponse.json({
				...existingSaved,
				_id: existingSaved.id,
				user: existingSaved.userId,
				link: f?.link || "",
				filters: f || {},
				subscriptionEnabled: existingSaved.notify,
				subscriptionFrequency: existingSaved.frequency,
			}, { status: 201 });
		}

		const prismaFilters = {
			...(filters || {}),
			link,
		};

		const savedSearch = await prisma.savedSearch.create({
			data: {
				userId: lead.id,
				name: name || "Saved Search",
				filters: prismaFilters,
				notify: true,
				frequency: "Daily",
			},
		});

		// Recalculate score asynchronously
		import("@/lib/leads/services/scoring.service").then(({ recalculateLeadScore }) => {
			recalculateLeadScore(lead.id);
		});

		return NextResponse.json({
			...savedSearch,
			_id: savedSearch.id,
			user: savedSearch.userId,
			link,
			filters,
			subscriptionEnabled: savedSearch.notify,
			subscriptionFrequency: savedSearch.frequency,
		}, { status: 201 });
	} catch (error) {
		console.error("Error creating saved search:", error);
		return NextResponse.json(
			{ error: "Failed to create saved search" },
			{ status: 500 }
		);
	}
}
